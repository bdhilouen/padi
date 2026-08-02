import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { DashboardService } from './dashboard.service.js';

type AuthRequest = Request & { user: JwtPayload };

/**
 * DashboardController — thin routing layer for /dashboard endpoints.
 * All routes protected by JwtAuthGuard.
 */
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /api/v1/dashboard
   * Returns the most recently synced service_status rows for the current user.
   * Does NOT trigger a fresh sync.
   * Response: DashboardServiceDto[] — no raw_data.
   */
  @Get()
  getDashboard(@Req() req: AuthRequest) {
    return this.dashboardService.getDashboard(req.user.sub);
  }

  /**
   * POST /api/v1/dashboard/refresh
   * Triggers a fresh sync against all 9 mock external services.
   * - Services without GRANTED consent are skipped (consent_required: true).
   * - Services that fail are skipped (sync_error: true) — NFR-004.
   * Response 200: DashboardServiceDto[] with full status.
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshDashboard(@Req() req: AuthRequest) {
    return this.dashboardService.refreshDashboard(req.user.sub);
  }
}
