import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsentService } from '../consent/consent.service.js';
import { ServiceNameEnum, StatusEnum } from '../../common/enums/index.js';
import { ServiceStatus } from './entities/service-status.entity.js';
import { BpjsMockService } from '../mock-external/services/bpjs.mock.service.js';
import { CoretaxMockService } from '../mock-external/services/coretax.mock.service.js';
import { EtleMockService } from '../mock-external/services/etle.mock.service.js';
import { MpasporMockService } from '../mock-external/services/mpaspor.mock.service.js';
import { OssMockService } from '../mock-external/services/oss.mock.service.js';
import { PdamMockService } from '../mock-external/services/pdam.mock.service.js';
import { PlnMockService } from '../mock-external/services/pln.mock.service.js';
import { SamsatMockService } from '../mock-external/services/samsat.mock.service.js';
import { SatusehatMockService } from '../mock-external/services/satusehat.mock.service.js';
import type { DashboardServiceDto } from './dto/dashboard-service.dto.js';

/** Internal result after attempting a single service sync. */
interface SyncResult {
  serviceName: ServiceNameEnum;
  status: StatusEnum | null;
  rawData: Record<string, unknown> | null;
  lastSyncedAt: Date | null;
  consentRequired: boolean;
  syncError: boolean;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(ServiceStatus)
    private readonly serviceStatusRepo: Repository<ServiceStatus>,

    private readonly consentService: ConsentService,

    // Individual mock services injected directly — no HttpModule needed
    // (backend-rules §6: Mock API is internal, not a separate HTTP service)
    private readonly coretaxMock: CoretaxMockService,
    private readonly bpjsMock: BpjsMockService,
    private readonly satusehatMock: SatusehatMockService,
    private readonly ossMock: OssMockService,
    private readonly samsatMock: SamsatMockService,
    private readonly plnMock: PlnMockService,
    private readonly pdamMock: PdamMockService,
    private readonly etleMock: EtleMockService,
    private readonly mpasporMock: MpasporMockService,
  ) {}

  // ─── GET /dashboard ───────────────────────────────────────────────────────

  /**
   * Returns the most recent service_status rows for the authenticated user.
   * Does NOT trigger a fresh sync — returns what is already in the DB.
   * If a service has never been synced, it is omitted from the response
   * (the client can call POST /dashboard/refresh to populate it).
   */
  async getDashboard(userId: string): Promise<DashboardServiceDto[]> {
    const rows = await this.serviceStatusRepo.find({
      where: { userId },
      order: { serviceName: 'ASC' },
    });

    return rows.map((row) => ({
      service_name: row.serviceName,
      status: row.status,
      last_synced_at: row.lastSyncedAt,
    }));
  }

  // ─── POST /dashboard/refresh ──────────────────────────────────────────────

  /**
   * Triggers a fresh sync for every service.
   *
   * For each service:
   *   1. Check consent (GRANTED required). If missing → mark consent_required, skip.
   *   2. Call the mock service. If it throws → mark sync_error, skip.
   *   3. Derive a status from the raw payload.
   *   4. Upsert the service_status row for this user + service_name.
   *
   * Per NFR-004: one service failing never breaks the response for others.
   * Per backend-rules §6: no queue, no HttpModule — synchronous in-process calls.
   */
  async refreshDashboard(userId: string): Promise<DashboardServiceDto[]> {
    const allServices = Object.values(ServiceNameEnum);

    // Run all syncs concurrently — each is wrapped in its own try/catch
    const results = await Promise.all(
      allServices.map((serviceName) =>
        this.syncOneService(userId, serviceName),
      ),
    );

    // Persist successful syncs (consent_required and sync_error rows are skipped)
    await Promise.all(
      results
        .filter((r) => !r.consentRequired && !r.syncError)
        .map((r) => this.upsertServiceStatus(userId, r)),
    );

    return results.map((r) => this.toDto(r));
  }

  // ─── Private: sync a single service ──────────────────────────────────────

  private async syncOneService(
    userId: string,
    serviceName: ServiceNameEnum,
  ): Promise<SyncResult> {
    // Step 1: Check consent — no DB write if consent is missing
    try {
      await this.consentService.requireGrantedConsent(userId, serviceName);
    } catch {
      // ForbiddenException from requireGrantedConsent — consent missing or revoked
      return {
        serviceName,
        status: null,
        rawData: null,
        lastSyncedAt: null,
        consentRequired: true,
        syncError: false,
      };
    }

    // Step 2: Call the appropriate mock service
    try {
      const rawData = this.callMock(userId, serviceName);
      const status = this.deriveStatus(serviceName, rawData);

      return {
        serviceName,
        status,
        rawData,
        lastSyncedAt: new Date(),
        consentRequired: false,
        syncError: false,
      };
    } catch (err) {
      // Log at warn level — not an application error, just a degraded service
      this.logger.warn(
        `Mock sync failed for service ${serviceName} / user ${userId}: ${String(err)}`,
      );
      return {
        serviceName,
        status: null,
        rawData: null,
        lastSyncedAt: null,
        consentRequired: false,
        syncError: true,
      };
    }
  }

  /**
   * Dispatches to the correct mock service by service name.
   * Returns the raw data payload as a plain object for storage in raw_data (JSONB).
   */
  private callMock(
    userId: string,
    serviceName: ServiceNameEnum,
  ): Record<string, unknown> {
    switch (serviceName) {
      case ServiceNameEnum.CORETAX:
        return this.coretaxMock.getData(userId) as unknown as Record<
          string,
          unknown
        >;
      case ServiceNameEnum.BPJS:
        return this.bpjsMock.getData(userId) as unknown as Record<
          string,
          unknown
        >;
      case ServiceNameEnum.SATUSEHAT:
        return this.satusehatMock.getData(userId) as unknown as Record<
          string,
          unknown
        >;
      case ServiceNameEnum.OSS:
        return this.ossMock.getData(userId) as unknown as Record<
          string,
          unknown
        >;
      case ServiceNameEnum.SAMSAT:
        return this.samsatMock.getData(userId) as unknown as Record<
          string,
          unknown
        >;
      case ServiceNameEnum.PLN:
        return this.plnMock.getData(userId) as unknown as Record<
          string,
          unknown
        >;
      case ServiceNameEnum.PDAM:
        return this.pdamMock.getData(userId) as unknown as Record<
          string,
          unknown
        >;
      case ServiceNameEnum.ETLE:
        return this.etleMock.getData(userId) as unknown as Record<
          string,
          unknown
        >;
      case ServiceNameEnum.MPASPOR:
        return this.mpasporMock.getData(userId) as unknown as Record<
          string,
          unknown
        >;
    }
  }

  /**
   * Derives a StatusEnum value from the raw payload.
   *
   * Rules are per-service and business-domain-appropriate:
   *   - ACTIVE   → everything normal
   *   - WARNING  → payment due soon, arrears present, nearing expiry, violations outstanding
   *   - EXPIRED  → past-due, expired document, account inactive
   *
   * The status is stored in service_status.status (not calculated at query time
   * — unlike deadlines, this originates from external sync results per backend-rules §2).
   */
  private deriveStatus(
    serviceName: ServiceNameEnum,
    raw: Record<string, unknown>,
  ): StatusEnum {
    switch (serviceName) {
      case ServiceNameEnum.CORETAX: {
        const s = raw['tax_status'] as string;
        if (s === 'OUTSTANDING') return StatusEnum.EXPIRED;
        if (s === 'LATE_FILING') return StatusEnum.WARNING;
        return StatusEnum.ACTIVE;
      }
      case ServiceNameEnum.BPJS: {
        const s = raw['status'] as string;
        if (s === 'MENUNGGAK') return StatusEnum.WARNING;
        return StatusEnum.ACTIVE;
      }
      case ServiceNameEnum.SATUSEHAT: {
        const vax = raw['vaccination_status'] as string;
        if (vax === 'BELUM') return StatusEnum.WARNING;
        return StatusEnum.ACTIVE;
      }
      case ServiceNameEnum.OSS: {
        const s = raw['license_status'] as string;
        if (s === 'PERLU_PERPANJANGAN') return StatusEnum.WARNING;
        return StatusEnum.ACTIVE;
      }
      case ServiceNameEnum.SAMSAT: {
        const s = raw['status'] as string;
        if (s === 'BELUM_BAYAR') return StatusEnum.WARNING;
        return StatusEnum.ACTIVE;
      }
      case ServiceNameEnum.PLN: {
        const s = raw['status'] as string;
        const kwh = raw['token_credit_kwh'] as number;
        if (s === 'BERDAYA_RENDAH' || kwh < 20) return StatusEnum.WARNING;
        return StatusEnum.ACTIVE;
      }
      case ServiceNameEnum.PDAM: {
        const s = raw['status'] as string;
        if (s === 'MENUNGGAK') return StatusEnum.WARNING;
        return StatusEnum.ACTIVE;
      }
      case ServiceNameEnum.ETLE: {
        const s = raw['status'] as string;
        if (s === 'ADA_TUNGGAKAN') return StatusEnum.WARNING;
        return StatusEnum.ACTIVE;
      }
      case ServiceNameEnum.MPASPOR: {
        const s = raw['status'] as string;
        if (s === 'KADALUARSA') return StatusEnum.EXPIRED;
        if (s === 'AKAN_KADALUARSA') return StatusEnum.WARNING;
        return StatusEnum.ACTIVE;
      }
    }
  }

  /**
   * Upserts a service_status row using TypeORM's upsert (ON CONFLICT DO UPDATE).
   * The (user_id, service_name) unique constraint is the conflict target.
   */
  private async upsertServiceStatus(
    userId: string,
    result: SyncResult,
  ): Promise<void> {
    // Using a raw INSERT … ON CONFLICT DO UPDATE rather than TypeORM's upsert()
    // to avoid the deep-partial generic type constraint on rawData (JSONB column).
    await this.serviceStatusRepo.query(
      `INSERT INTO service_status
         (user_id, service_name, status, raw_data, last_synced_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, service_name) DO UPDATE SET
         status         = EXCLUDED.status,
         raw_data       = EXCLUDED.raw_data,
         last_synced_at = EXCLUDED.last_synced_at,
         updated_at     = now()`,
      [
        userId,
        result.serviceName,
        result.status ?? StatusEnum.ACTIVE,
        JSON.stringify(result.rawData),
        result.lastSyncedAt ?? new Date(),
      ],
    );
  }

  /** Maps a SyncResult to the safe response DTO (no raw_data). */
  private toDto(result: SyncResult): DashboardServiceDto {
    const dto: DashboardServiceDto = {
      service_name: result.serviceName,
      status: result.status,
      last_synced_at: result.lastSyncedAt,
    };
    if (result.consentRequired) dto.consent_required = true;
    if (result.syncError) dto.sync_error = true;
    return dto;
  }
}
