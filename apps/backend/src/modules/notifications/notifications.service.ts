import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Not, Repository } from 'typeorm';
import {
  NotificationChannelEnum,
  NotificationTypeEnum,
} from '../../common/enums/index.js';
import { Deadline } from '../timeline-reminder/entities/deadline.entity.js';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto.js';
import { NotificationDto } from './dto/notification.dto.js';
import { NotificationLog } from './entities/notification-log.entity.js';

interface DeadlineReminderRow {
  id: string;
  userId: string;
  title: string;
  dueDate: string;
  daysRemaining: number;
  reminderSentH30: boolean;
  reminderSentH7: boolean;
  reminderSentH1: boolean;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationLog)
    private readonly notificationLogRepo: Repository<NotificationLog>,

    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  // ─── GET /notifications ─────────────────────────────────────────────────

  async listNotifications(
    userId: string,
    query: ListNotificationsQueryDto,
  ): Promise<NotificationDto[]> {
    // Process any pending smart reminders before returning user's notifications
    await this.processSmartReminders(userId);

    const whereCondition: Record<string, unknown> = { userId };

    if (query.unread === true) {
      whereCondition.readAt = IsNull();
    } else if (query.unread === false) {
      whereCondition.readAt = Not(IsNull());
    }

    const logs = await this.notificationLogRepo.find({
      where: whereCondition,
      order: { sentAt: 'DESC' },
    });

    return logs.map((log) => this.toDto(log));
  }

  // ─── PATCH /notifications/:notificationId/read ──────────────────────────

  async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<NotificationDto> {
    const notification = await this.notificationLogRepo.findOne({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this notification',
      );
    }

    if (!notification.readAt) {
      notification.readAt = new Date();
      const updated = await this.notificationLogRepo.save(notification);
      return this.toDto(updated);
    }

    return this.toDto(notification);
  }

  // ─── Smart Reminder Generator (FR-005) ───────────────────────────────────

  /**
   * Processes deadlines and generates SMART_REMINDER notification_logs
   * when thresholds H-30, H-7, or H-1 are crossed.
   *
   * Deduplication guarantee:
   * Uses atomic conditional updates on the `deadlines` table flags
   * (reminder_sent_h30, reminder_sent_h7, reminder_sent_h1) inside a DB
   * transaction to ensure each threshold is notified at most once.
   */
  async processSmartReminders(userId?: string): Promise<number> {
    const params: unknown[] = [];
    let whereSql =
      'due_date >= CURRENT_DATE AND (reminder_sent_h30 = false OR reminder_sent_h7 = false OR reminder_sent_h1 = false)';

    if (userId) {
      params.push(userId);
      whereSql += ` AND user_id = $1`;
    }

    const querySql = `
      SELECT
        id,
        user_id AS "userId",
        title,
        due_date AS "dueDate",
        (due_date - CURRENT_DATE) AS "daysRemaining",
        reminder_sent_h30 AS "reminderSentH30",
        reminder_sent_h7 AS "reminderSentH7",
        reminder_sent_h1 AS "reminderSentH1"
      FROM deadlines
      WHERE ${whereSql}
    `;

    const deadlines = await this.dataSource.query<DeadlineReminderRow[]>(
      querySql,
      params,
    );

    let createdCount = 0;

    for (const deadline of deadlines) {
      const daysRemaining = Number(deadline.daysRemaining);

      if (daysRemaining <= 30 && !deadline.reminderSentH30) {
        const created = await this.createReminderNotification(
          deadline,
          'H-30',
          30,
          'reminderSentH30',
        );
        if (created) createdCount++;
      }

      if (daysRemaining <= 7 && !deadline.reminderSentH7) {
        const created = await this.createReminderNotification(
          deadline,
          'H-7',
          7,
          'reminderSentH7',
        );
        if (created) createdCount++;
      }

      if (daysRemaining <= 1 && !deadline.reminderSentH1) {
        const created = await this.createReminderNotification(
          deadline,
          'H-1',
          1,
          'reminderSentH1',
        );
        if (created) createdCount++;
      }
    }

    return createdCount;
  }

  private async createReminderNotification(
    deadline: DeadlineReminderRow,
    label: string,
    days: number,
    field: 'reminderSentH30' | 'reminderSentH7' | 'reminderSentH1',
  ): Promise<boolean> {
    return await this.dataSource.transaction(async (manager) => {
      const updateResult = await manager
        .getRepository(Deadline)
        .update({ id: deadline.id, [field]: false }, { [field]: true });

      if (!updateResult.affected || updateResult.affected === 0) {
        return false;
      }

      const daysText = days === 1 ? '1 hari' : `${days} hari`;
      const title = `Pengingat ${label}: ${deadline.title}`;
      const message = `Tenggat waktu untuk ${deadline.title} tersisa ${daysText} lagi (jatuh tempo: ${deadline.dueDate}).`;

      const notification = manager.getRepository(NotificationLog).create({
        userId: deadline.userId,
        deadlineId: deadline.id,
        title,
        type: NotificationTypeEnum.SMART_REMINDER,
        channel: NotificationChannelEnum.IN_APP,
        message,
        sentAt: new Date(),
      });

      await manager.getRepository(NotificationLog).save(notification);

      return true;
    });
  }

  // ─── Private Helpers ────────────────────────────────────────────────────

  private toDto(log: NotificationLog): NotificationDto {
    return {
      id: log.id,
      title: log.title,
      type: log.type,
      message: log.message,
      sent_at: log.sentAt,
      read_at: log.readAt,
    };
  }
}
