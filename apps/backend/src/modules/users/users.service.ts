import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CryptoService } from '../../common/crypto/crypto.service.js';
import { AuthService } from '../auth/auth.service.js';
import { RefreshToken } from '../auth/entities/refresh-token.entity.js';
import { UserSession } from '../auth/entities/user-session.entity.js';
import { User } from './entities/user.entity.js';
import type { ChangePasswordDto } from './dto/change-password.dto.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';
import type { UserProfileDto } from './dto/user-profile.dto.js';
import type { SessionDto } from './dto/session.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(UserSession)
    private readonly sessionRepo: Repository<UserSession>,

    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,

    private readonly cryptoService: CryptoService,
    private readonly authService: AuthService,
  ) {}

  // ─── GET /users/me ────────────────────────────────────────────────────────

  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.findActiveUserOrThrow(userId);
    return this.toProfileDto(user);
  }

  // ─── PATCH /users/me ──────────────────────────────────────────────────────

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    // Require at least one field to update — avoid no-op PATCHes
    if (dto.full_name === undefined && dto.phone_number === undefined) {
      throw new BadRequestException(
        'Provide at least one field to update: full_name or phone_number',
      );
    }

    const user = await this.findActiveUserOrThrow(userId);

    if (dto.full_name !== undefined) {
      user.fullName = dto.full_name;
    }
    if (dto.phone_number !== undefined) {
      user.phoneNumber = dto.phone_number;
    }

    const saved = await this.userRepo.save(user);
    return this.toProfileDto(saved);
  }

  // ─── PATCH /users/me/password ─────────────────────────────────────────────

  async changePassword(
    userId: string,
    sessionId: string | null,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    // Cross-field validation: new_password and confirm_password must match
    if (dto.new_password !== dto.confirm_password) {
      throw new BadRequestException(
        'confirm_password does not match new_password',
      );
    }

    const user = await this.findActiveUserOrThrow(userId);

    // Verify the old password against the stored bcrypt hash
    const isOldPasswordValid = await this.cryptoService.verifyPassword(
      dto.old_password,
      user.passwordHash,
    );

    if (!isOldPasswordValid) {
      // Deliberately vague — do not confirm whether the account exists
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash and persist the new password
    user.passwordHash = await this.cryptoService.hashPassword(dto.new_password);
    await this.userRepo.save(user);

    // Per backend-rules.md §4: revoke all refresh tokens and sessions for this user EXCEPT
    // the current session, so other active sessions are logged out automatically
    await this.authService.revokeAllSessions(userId, sessionId);

    return { message: 'Password changed successfully' };
  }

  // ─── GET /users/me/sessions ───────────────────────────────────────────────

  async listSessions(userId: string): Promise<SessionDto[]> {
    const sessions = await this.sessionRepo.find({
      where: { userId },
      order: { loginAt: 'DESC' },
    });

    return sessions.map((s) => this.toSessionDto(s));
  }

  // ─── DELETE /users/me/sessions/:sessionId ────────────────────────────────

  async revokeSession(
    userId: string,
    sessionId: string,
  ): Promise<{ message: string }> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const now = new Date();

    // Mark the session itself as inactive
    session.isActive = false;
    session.logoutAt = now;
    await this.sessionRepo.save(session);

    // Revoke all refresh tokens tied to this session
    await this.refreshTokenRepo.update(
      { userSessionId: sessionId, revokedAt: IsNull() },
      { revokedAt: now },
    );

    return { message: 'Session revoked successfully' };
  }

  // ─── DELETE /users/me ─────────────────────────────────────────────────────

  async softDeleteAccount(userId: string): Promise<{ message: string }> {
    const user = await this.findActiveUserOrThrow(userId);

    // Revoke all tokens first so the account becomes immediately unusable
    await this.authService.revokeAllSessions(userId);

    // TypeORM soft delete sets deleted_at via @DeleteDateColumn
    await this.userRepo.softRemove(user);

    return { message: 'Account deleted successfully' };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Fetches an active (non-deleted, non-suspended) user or throws 404.
   * Using 404 rather than 401/403 here because the user ID comes from a
   * validated JWT — if it 404s, something has gone seriously wrong (e.g. the
   * account was hard-deleted before the cron ran).
   */
  private async findActiveUserOrThrow(userId: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      // withDeleted: false (default) — TypeORM excludes soft-deleted rows automatically
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /** Maps a User entity to the safe response DTO. Never includes sensitive fields. */
  private toProfileDto(user: User): UserProfileDto {
    return {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      phone_number: user.phoneNumber,
      role: user.role,
      is_active: user.isActive,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    };
  }

  /** Maps a UserSession entity to the safe response DTO. */
  private toSessionDto(session: UserSession): SessionDto {
    return {
      id: session.id,
      device_name: session.deviceName,
      user_agent: session.userAgent,
      ip_address: session.ipAddress,
      is_active: session.isActive,
      login_at: session.loginAt,
      last_activity_at: session.lastActivityAt,
      logout_at: session.logoutAt,
    };
  }
}
