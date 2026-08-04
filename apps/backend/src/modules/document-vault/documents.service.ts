import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { Repository } from 'typeorm';
import { CryptoService } from '../../common/crypto/crypto.service.js';
import { User } from '../users/entities/user.entity.js';
import type { UploadDocumentDto } from './dto/upload-document.dto.js';
import type { VerifyDocumentDto } from './dto/verify-document.dto.js';
import type { UserDocumentDto } from './dto/user-document.dto.js';
import type { PreviewUrlDto } from './dto/preview-url.dto.js';
import { UserDocument } from './entities/user-document.entity.js';

export interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export function detectMimeType(buffer: Buffer): string | null {
  if (
    buffer.length >= 4 &&
    buffer.subarray(0, 4).toString('ascii') === '%PDF'
  ) {
    return 'application/pdf';
  }
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  return null;
}

interface PreviewTokenPayload {
  sub: string;
  doc_id: string;
  type: string;
}

@Injectable()
export class DocumentsService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'documents');

  constructor(
    @InjectRepository(UserDocument)
    private readonly userDocRepo: Repository<UserDocument>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly cryptoService: CryptoService,
    private readonly jwtService: JwtService,
  ) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // ─── POST /documents ──────────────────────────────────────────────────────

  async uploadDocument(
    userId: string,
    file: MulterFile | undefined,
    dto: UploadDocumentDto,
  ): Promise<UserDocumentDto> {
    if (!file || !file.buffer) {
      throw new BadRequestException('file is required');
    }

    const detectedMime = detectMimeType(file.buffer);
    if (!detectedMime || !ALLOWED_MIME_TYPES.includes(detectedMime)) {
      throw new BadRequestException(
        'Invalid file format. Only PDF, JPEG, and PNG files are allowed.',
      );
    }

    const fileId = randomUUID();
    const storageKey = `${fileId}.enc`;
    const filePath = path.join(this.uploadDir, storageKey);

    const encryptedBuffer = this.cryptoService.encryptBuffer(file.buffer);
    fs.writeFileSync(filePath, encryptedBuffer);

    const doc = this.userDocRepo.create({
      userId,
      documentType: dto.document_type,
      originalFilename: file.originalname,
      mimeType: detectedMime,
      fileSize: String(file.buffer.length),
      encryptedUrl: filePath,
      storageKey,
      expiryDate: dto.expiry_date ?? null,
    });

    const saved = await this.userDocRepo.save(doc);
    return this.toDto(saved);
  }

  // ─── GET /documents ───────────────────────────────────────────────────────

  async listMyDocuments(userId: string): Promise<UserDocumentDto[]> {
    const docs = await this.userDocRepo.find({
      where: { userId },
      order: { uploadedAt: 'DESC' },
    });

    return docs.map((doc) => this.toDto(doc));
  }

  // ─── POST /documents/:documentId/verify ────────────────────────────────────

  async verifyAndGetPreviewUrl(
    userId: string,
    documentId: string,
    dto: VerifyDocumentDto,
  ): Promise<PreviewUrlDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await this.cryptoService.verifyPassword(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    const doc = await this.userDocRepo.findOne({ where: { id: documentId } });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    if (doc.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this document',
      );
    }

    doc.lastVerifiedAt = new Date();
    await this.userDocRepo.save(doc);

    const expiresInSeconds = 300; // 5 minutes short-lived URL
    const payload: PreviewTokenPayload = {
      sub: userId,
      doc_id: documentId,
      type: 'document_preview',
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: `${expiresInSeconds}s`,
    });

    const previewUrl = `/api/v1/documents/preview/${token}`;

    return {
      preview_url: previewUrl,
      expires_in: expiresInSeconds,
      previewUrl,
      expiresIn: expiresInSeconds,
    };
  }

  // ─── DELETE /documents/:documentId ─────────────────────────────────────────

  async deleteDocument(
    userId: string,
    documentId: string,
  ): Promise<{ message: string }> {
    const doc = await this.userDocRepo.findOne({ where: { id: documentId } });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    if (doc.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this document',
      );
    }

    const filePath = path.join(this.uploadDir, doc.storageKey);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        // Ignore file deletion error if missing from disk
      }
    }

    await this.userDocRepo.remove(doc);

    return { message: 'Document deleted successfully' };
  }

  // ─── GET /documents/preview/:token ────────────────────────────────────────

  async streamPreview(
    token: string,
  ): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    let payload: PreviewTokenPayload;
    try {
      payload = this.jwtService.verify<PreviewTokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired preview token');
    }

    if (
      payload.type !== 'document_preview' ||
      !payload.doc_id ||
      !payload.sub
    ) {
      throw new UnauthorizedException('Invalid preview token payload');
    }

    const doc = await this.userDocRepo.findOne({
      where: { id: payload.doc_id, userId: payload.sub },
    });

    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    const filePath = path.join(this.uploadDir, doc.storageKey);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Encrypted document file not found');
    }

    const encryptedBuffer = fs.readFileSync(filePath);
    const decryptedBuffer = this.cryptoService.decryptBuffer(encryptedBuffer);

    return {
      buffer: decryptedBuffer,
      mimeType: doc.mimeType,
      filename: doc.originalFilename,
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private toDto(doc: UserDocument): UserDocumentDto {
    return {
      id: doc.id,
      document_type: doc.documentType,
      original_filename: doc.originalFilename,
      mime_type: doc.mimeType,
      file_size: Number(doc.fileSize),
      expiry_date: doc.expiryDate,
      uploaded_at: doc.uploadedAt,
      last_verified_at: doc.lastVerifiedAt,
    };
  }
}
