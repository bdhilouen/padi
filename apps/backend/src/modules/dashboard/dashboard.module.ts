import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsentModule } from '../consent/consent.module.js';
import { MockExternalModule } from '../mock-external/mock-external.module.js';
import { ServiceStatus } from './entities/service-status.entity.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceStatus]),
    // ConsentService.requireGrantedConsent() — exported from ConsentModule
    ConsentModule,
    // All 9 mock service providers — exported from MockExternalModule
    MockExternalModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
