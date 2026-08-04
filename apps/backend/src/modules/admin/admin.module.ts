import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { AuditLog } from './entities/audit-log.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, AuditLog])],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
