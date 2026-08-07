import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { ChatSession } from './entities/chat-session.entity.js';
import { ChatMessage } from './entities/chat-message.entity.js';
import { UsersModule } from '../users/users.module.js';
import { DashboardModule } from '../dashboard/dashboard.module.js';
import { TimelineReminderModule } from '../timeline-reminder/timeline-reminder.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession, ChatMessage]),
    HttpModule.register({ timeout: 30000 }),
    UsersModule,
    DashboardModule,
    TimelineReminderModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
