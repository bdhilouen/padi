import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto.js';
import { NotificationDto } from './dto/notification.dto.js';
import { NotificationsService } from './notifications.service.js';

type AuthRequest = Request & { user: JwtPayload };

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  listNotifications(
    @Req() req: AuthRequest,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<NotificationDto[]> {
    return this.notificationsService.listNotifications(req.user.sub, query);
  }

  @Patch(':notificationId/read')
  @HttpCode(HttpStatus.OK)
  markAsRead(
    @Req() req: AuthRequest,
    @Param('notificationId', ParseUUIDPipe) notificationId: string,
  ): Promise<NotificationDto> {
    return this.notificationsService.markAsRead(req.user.sub, notificationId);
  }
}
