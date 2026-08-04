import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { DocumentsService, type MulterFile } from './documents.service.js';
import { UploadDocumentDto } from './dto/upload-document.dto.js';
import { VerifyDocumentDto } from './dto/verify-document.dto.js';

type AuthRequest = Request & { user: JwtPayload };

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

const multerOptions: MulterOptions = {
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (
    _req: Request,
    file: MulterFile,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, false);
      return;
    }
    cb(null, true);
  },
};

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  uploadDocument(
    @Req() req: AuthRequest,
    @UploadedFile() file: MulterFile | undefined,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.documentsService.uploadDocument(req.user.sub, file, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  listMyDocuments(@Req() req: AuthRequest) {
    return this.documentsService.listMyDocuments(req.user.sub);
  }

  @Post(':documentId/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  verifyAndGetPreviewUrl(
    @Req() req: AuthRequest,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() dto: VerifyDocumentDto,
  ) {
    return this.documentsService.verifyAndGetPreviewUrl(
      req.user.sub,
      documentId,
      dto,
    );
  }

  @Delete(':documentId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  deleteDocument(
    @Req() req: AuthRequest,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ) {
    return this.documentsService.deleteDocument(req.user.sub, documentId);
  }

  /**
   * Public preview retrieval route — authenticates via short-lived signed token,
   * NOT via standard JwtAuthGuard header.
   */
  @Get('preview/:token')
  async previewDocument(@Param('token') token: string, @Res() res: Response) {
    const { buffer, mimeType, filename } =
      await this.documentsService.streamPreview(token);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
      'Content-Length': buffer.length.toString(),
    });

    res.send(buffer);
  }
}
