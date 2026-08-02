import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeadlineController } from './deadline.controller.js';
import { DeadlineService } from './deadline.service.js';
import { Deadline } from './entities/deadline.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Deadline])],
  controllers: [DeadlineController],
  providers: [DeadlineService],
})
export class DeadlineModule {}

export { DeadlineModule as TimelineReminderModule };
