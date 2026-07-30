import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UsersService } from './users.service.js';

/** Authenticated request type — request.user is populated by JwtAuthGuard. */
type AuthRequest = Request & { user: JwtPayload };

/**
 * UsersController — thin routing layer for /users/me endpoints.
 *
 * All routes are protected by JwtAuthGuard.
 * User identity is always taken from request.user.sub (JWT payload),
 * never from a client-supplied body or query param.
 */
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /api/v1/users/me
   * Returns the authenticated user's profile.
   * Response: UserProfileDto (no sensitive fields).
   */
  @Get('me')
  getProfile(@Req() req: AuthRequest) {
    return this.usersService.getProfile(req.user.sub);
  }

  /**
   * PATCH /api/v1/users/me
   * Updates full_name and/or phone_number.
   * Email, NIK, and role are immutable through this endpoint.
   * Response: updated UserProfileDto.
   */
  @Patch('me')
  updateProfile(@Req() req: AuthRequest, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.sub, dto);
  }

  /**
   * PATCH /api/v1/users/me/password
   * Changes the user's password.
   * Requires old_password verification. Revokes all refresh tokens on success.
   * Response 200: { message }
   */
  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  changePassword(@Req() req: AuthRequest, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.sub, dto);
  }

  /**
   * GET /api/v1/users/me/sessions
   * Lists all sessions (including inactive) for the authenticated user.
   * Response: SessionDto[] — no token hashes, no user_id.
   */
  @Get('me/sessions')
  listSessions(@Req() req: AuthRequest) {
    return this.usersService.listSessions(req.user.sub);
  }

  /**
   * DELETE /api/v1/users/me/sessions/:sessionId
   * Revokes a specific session: sets is_active=false, logout_at=now(),
   * and revokes all refresh_tokens with matching user_session_id.
   * Response 200: { message }
   */
  @Delete('me/sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  revokeSession(
    @Req() req: AuthRequest,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.usersService.revokeSession(req.user.sub, sessionId);
  }

  /**
   * DELETE /api/v1/users/me
   * Soft-deletes the authenticated user's account.
   * Sets deleted_at via TypeORM @DeleteDateColumn. Does NOT hard-delete.
   * Hard deletion (if required by data retention policy) is handled by a
   * scheduled cron job, not this endpoint.
   * Response 200: { message }
   */
  @Delete('me')
  @HttpCode(HttpStatus.OK)
  deleteAccount(@Req() req: AuthRequest) {
    return this.usersService.softDeleteAccount(req.user.sub);
  }
}
