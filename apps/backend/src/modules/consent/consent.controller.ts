import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { GrantConsentDto } from './dto/grant-consent.dto.js';
import { ConsentService } from './consent.service.js';

/** Authenticated request type — request.user is populated by JwtAuthGuard. */
type AuthRequest = Request & { user: JwtPayload };

/**
 * ConsentController — thin routing layer for /consent endpoints.
 *
 * All routes are protected by JwtAuthGuard.
 * user_id is always taken from req.user.sub (JWT payload), never from
 * the request body or query params.
 */
@UseGuards(JwtAuthGuard)
@Controller('consent')
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  /**
   * GET /api/v1/consent
   * Lists all consent records for the authenticated user.
   * Response: ConsentRecordDto[]
   */
  @Get()
  listConsents(@Req() req: AuthRequest) {
    return this.consentService.listConsents(req.user.sub);
  }

  /**
   * POST /api/v1/consent
   * Grants consent for a service_name.
   * Idempotent: if a record already exists, it is updated to GRANTED.
   * Response 201: ConsentRecordDto
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  grantConsent(@Req() req: AuthRequest, @Body() dto: GrantConsentDto) {
    return this.consentService.grantConsent(req.user.sub, dto);
  }

  /**
   * PATCH /api/v1/consent/:consentId/revoke
   * Revokes a specific consent record.
   * Returns 404 if the record does not exist.
   * Returns 403 if the record belongs to a different user.
   * Response 200: ConsentRecordDto
   */
  @Patch(':consentId/revoke')
  @HttpCode(HttpStatus.OK)
  revokeConsent(
    @Req() req: AuthRequest,
    @Param('consentId', ParseUUIDPipe) consentId: string,
  ) {
    return this.consentService.revokeConsent(req.user.sub, consentId);
  }
}
