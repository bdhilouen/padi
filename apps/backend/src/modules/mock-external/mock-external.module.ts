import { Module } from '@nestjs/common';
import { BpjsMockService } from './services/bpjs.mock.service.js';
import { CoretaxMockService } from './services/coretax.mock.service.js';
import { EtleMockService } from './services/etle.mock.service.js';
import { MpasporMockService } from './services/mpaspor.mock.service.js';
import { OssMockService } from './services/oss.mock.service.js';
import { PdamMockService } from './services/pdam.mock.service.js';
import { PlnMockService } from './services/pln.mock.service.js';
import { SamsatMockService } from './services/samsat.mock.service.js';
import { SatusehatMockService } from './services/satusehat.mock.service.js';

/**
 * MockExternalModule — internal simulation of all 9 government service APIs.
 *
 * This module is intentionally NOT registered in AppModule directly.
 * It is imported only by DashboardModule (and any future sync module).
 *
 * Per backend-rules §6:
 *   - No HTTP controllers — this is purely an internal service layer.
 *   - All responses are deterministic (same userId → same data).
 *   - No RabbitMQ or queues — synchronous in-process calls only.
 */
@Module({
  providers: [
    CoretaxMockService,
    BpjsMockService,
    SatusehatMockService,
    OssMockService,
    SamsatMockService,
    PlnMockService,
    PdamMockService,
    EtleMockService,
    MpasporMockService,
  ],
  exports: [
    CoretaxMockService,
    BpjsMockService,
    SatusehatMockService,
    OssMockService,
    SamsatMockService,
    PlnMockService,
    PdamMockService,
    EtleMockService,
    MpasporMockService,
  ],
})
export class MockExternalModule {}
