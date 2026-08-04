import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsentRecord } from './entities/consent-record.entity.js';
import { ConsentController } from './consent.controller.js';
import { ConsentService } from './consent.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([ConsentRecord])],
  controllers: [ConsentController],
  providers: [ConsentService],
  // ConsentService is exported so other modules (Dashboard, etc.) can call
  // requireGrantedConsent() without duplicating the consent-check logic.
  exports: [ConsentService],
})
export class ConsentModule {}
