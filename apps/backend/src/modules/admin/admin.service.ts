import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import { AuditLog } from './entities/audit-log.entity.js';
import type { ListUsersQueryDto } from './dto/list-users-query.dto.js';
import type { UpdateUserStatusDto } from './dto/update-user-status.dto.js';
import type { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto.js';
import type { UserAdminDto } from './dto/user-admin.dto.js';
import type { UserAdminListDto } from './dto/user-admin-list.dto.js';
import type { AuditLogDto } from './dto/audit-log.dto.js';
import type { AuditLogListDto } from './dto/audit-log-list.dto.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,

    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  // ─── GET /admin/users ─────────────────────────────────────────────────────

  async listUsers(query: ListUsersQueryDto): Promise<UserAdminListDto> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    const queryBuilder = this.userRepo.createQueryBuilder('user').withDeleted();

    if (query.search) {
      const searchTerm = `%${query.search.toLowerCase()}%`;
      queryBuilder.andWhere(
        '(LOWER(user.email) LIKE :search OR LOWER(user.fullName) LIKE :search OR LOWER(user.phoneNumber) LIKE :search)',
        { search: searchTerm },
      );
    }

    const total = await queryBuilder.getCount();

    const users = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();

    return {
      data: users.map((u) => this.toUserAdminDto(u)),
      meta: { total, page, limit },
    };
  }

  // ─── GET /admin/users/:id ────────────────────────────────────────────────

  async getUserDetail(id: string): Promise<UserAdminDto> {
    const user = await this.userRepo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toUserAdminDto(user);
  }

  // ─── PATCH /admin/users/:id/status ────────────────────────────────────────

  async updateUserStatus(
    adminUserId: string,
    targetUserId: string,
    dto: UpdateUserStatusDto,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<UserAdminDto> {
    const user = await this.userRepo.findOne({
      where: { id: targetUserId },
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = dto.is_active;
    const savedUser = await this.userRepo.save(user);

    if (!dto.is_active) {
      // Per backend-rules.md §4: revoke active refresh tokens and deactivate sessions when suspending
      await this.dataSource.query(
        `UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`,
        [targetUserId],
      );
      await this.dataSource.query(
        `UPDATE user_sessions SET is_active = false, logout_at = now() WHERE user_id = $1 AND is_active = true`,
        [targetUserId],
      );
    }

    // Write audit log entry for the admin action (including target user ID in action string)
    const action = dto.is_active
      ? `ADMIN_ACTIVATE_USER:${targetUserId}`
      : `ADMIN_SUSPEND_USER:${targetUserId}`;
    const auditLog = this.auditLogRepo.create({
      userId: adminUserId,
      action,
      ipAddress,
      userAgent,
    });
    await this.auditLogRepo.save(auditLog);

    return this.toUserAdminDto(savedUser);
  }

  // ─── GET /admin/audit-logs ────────────────────────────────────────────────

  async listAuditLogs(query: ListAuditLogsQueryDto): Promise<AuditLogListDto> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    const queryBuilder = this.auditLogRepo.createQueryBuilder('log');

    if (query.user_id) {
      queryBuilder.andWhere('log.userId = :userId', { userId: query.user_id });
    }

    if (query.from) {
      queryBuilder.andWhere('log.createdAt >= :from', {
        from: new Date(query.from),
      });
    }

    if (query.to) {
      const toDate = new Date(query.to);
      if (query.to.length === 10) {
        // YYYY-MM-DD string — expand to end of day
        toDate.setDate(toDate.getDate() + 1);
      }
      queryBuilder.andWhere('log.createdAt <= :to', { to: toDate });
    }

    const total = await queryBuilder.getCount();

    const logs = await queryBuilder
      .orderBy('log.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getMany();

    return {
      data: logs.map((log) => this.toAuditLogDto(log)),
      meta: { total, page, limit },
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private toUserAdminDto(user: User): UserAdminDto {
    return {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      phone_number: user.phoneNumber,
      role: user.role,
      is_active: user.isActive,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      deleted_at: user.deletedAt ?? null,
    };
  }

  private toAuditLogDto(log: AuditLog): AuditLogDto {
    return {
      id: log.id,
      user_id: log.userId,
      action: log.action,
      service_accessed: log.serviceAccessed,
      ip_address: log.ipAddress,
      user_agent: log.userAgent,
      created_at: log.createdAt,
    };
  }
}
