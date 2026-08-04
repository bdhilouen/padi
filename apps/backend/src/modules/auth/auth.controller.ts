import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { RegisterDto } from './dto/register.dto.js';

/**
 * AuthController — thin layer: parse HTTP, delegate to AuthService, return result.
 *
 * All four endpoints are public (no JwtAuthGuard) as per the Postman collection.
 * POST /auth/logout accepts a Bearer token in the Postman collection but works
 * via the refreshToken body field, so no guard is required here either.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/v1/auth/register
   * Response 201: { id, email, full_name, phone_number, role, created_at }
   * NIK and password are never returned.
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * POST /api/v1/auth/login
   * Response 200: { accessToken, refreshToken }
   * Creates a user_sessions row and a refresh_tokens row.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    const ipAddress = req.ip ?? null;
    const userAgent = req.headers['user-agent'] ?? null;
    return this.authService.login(dto, ipAddress, userAgent);
  }

  /**
   * POST /api/v1/auth/refresh
   * Response 200: { accessToken, refreshToken }
   * Performs token rotation — old token is revoked immediately.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  /**
   * POST /api/v1/auth/logout
   * Response 200: { message }
   * Sets revoked_at on the refresh token and is_active=false on the session.
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }
}
