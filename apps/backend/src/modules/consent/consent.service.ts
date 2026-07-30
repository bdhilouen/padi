import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConsentStatusEnum,
  ServiceNameEnum,
} from '../../common/enums/index.js';
import { ConsentRecord } from './entities/consent-record.entity.js';
import type { ConsentRecordDto } from './dto/consent-record.dto.js';
import type { GrantConsentDto } from './dto/grant-consent.dto.js';

@Injectable()
export class ConsentService {
  constructor(
    @InjectRepository(ConsentRecord)
    private readonly consentRepo: Repository<ConsentRecord>,
  ) {}

  // ─── GET /consent ─────────────────────────────────────────────────────────

  async listConsents(userId: string): Promise<ConsentRecordDto[]> {
    const records = await this.consentRepo.find({
      where: { userId },
      order: { serviceName: 'ASC' },
    });

    return records.map((r) => this.toDto(r));
  }

  // ─── POST /consent ────────────────────────────────────────────────────────

  /**
   * Grant consent for a service.
   *
   * The (user_id, service_name) pair has a UNIQUE constraint in the DB.
   * Rather than letting that constraint surface as a 409, we use upsert
   * semantics: if a row already exists (any status), we update it to
   * GRANTED and refresh granted_at. This makes the endpoint idempotent
   * and handles the "re-grant after revoke" flow cleanly.
   */
  async grantConsent(
    userId: string,
    dto: GrantConsentDto,
  ): Promise<ConsentRecordDto> {
    const now = new Date();

    // Try to find an existing record for this user + service
    const existing = await this.consentRepo.findOne({
      where: { userId, serviceName: dto.service_name },
    });

    if (existing) {
      // Update existing record to GRANTED regardless of current status
      existing.status = ConsentStatusEnum.GRANTED;
      existing.grantedAt = now;
      existing.revokedAt = null; // clear any previous revocation
      const saved = await this.consentRepo.save(existing);
      return this.toDto(saved);
    }

    // Insert a brand-new consent record
    const record = this.consentRepo.create({
      userId,
      serviceName: dto.service_name,
      status: ConsentStatusEnum.GRANTED,
      grantedAt: now,
    });

    const saved = await this.consentRepo.save(record);
    return this.toDto(saved);
  }

  // ─── PATCH /consent/:consentId/revoke ─────────────────────────────────────

  async revokeConsent(
    userId: string,
    consentId: string,
  ): Promise<ConsentRecordDto> {
    const record = await this.consentRepo.findOne({
      where: { id: consentId },
    });

    // 404 if the record doesn't exist at all
    if (!record) {
      throw new NotFoundException('Consent record not found');
    }

    // 403 if it exists but belongs to a different user
    // (separate check to avoid leaking existence information via a timing side-channel
    //  would be a concern for a high-security system; for this prototype 403 is clearer)
    if (record.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to revoke this consent record',
      );
    }

    record.status = ConsentStatusEnum.REVOKED;
    record.revokedAt = new Date();

    const saved = await this.consentRepo.save(record);
    return this.toDto(saved);
  }

  // ─── Reusable consent check — for use by other modules (Dashboard, etc.) ──

  /**
   * Verifies that a GRANTED consent record exists for the given user and
   * service. Throws ForbiddenException if consent is absent or revoked.
   *
   * Usage in future modules (e.g. Dashboard before calling Mock API):
   *
   *   await this.consentService.requireGrantedConsent(userId, ServiceNameEnum.CORETAX);
   *
   * Call once per service per request before forwarding to the Adapter/Mock API.
   * Per backend-rules.md §3: every access to external services must first verify
   * a valid consent_records row with status = GRANTED.
   */
  async requireGrantedConsent(
    userId: string,
    serviceName: ServiceNameEnum,
  ): Promise<void> {
    const record = await this.consentRepo.findOne({
      where: {
        userId,
        serviceName,
        status: ConsentStatusEnum.GRANTED,
      },
    });

    if (!record) {
      throw new ForbiddenException(
        `Consent for service "${serviceName}" has not been granted. ` +
          'Please grant consent before accessing this service.',
      );
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /** Explicit allow-list mapping — new entity columns never surface in responses. */
  private toDto(record: ConsentRecord): ConsentRecordDto {
    return {
      id: record.id,
      service_name: record.serviceName,
      status: record.status,
      granted_at: record.grantedAt,
      revoked_at: record.revokedAt,
    };
  }
}
