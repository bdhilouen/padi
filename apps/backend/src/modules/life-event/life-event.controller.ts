import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { SelectLifeEventDto } from './dto/select-life-event.dto.js';
import { LifeEventService } from './life-event.service.js';

/** Authenticated request type — req.user populated by JwtAuthGuard. */
type AuthRequest = Request & { user: JwtPayload };

/**
 * LifeEventController — thin routing layer for /life-events endpoints.
 *
 * All routes protected by JwtAuthGuard.
 * user_id is always taken from req.user.sub, never from request body.
 *
 * Routes:
 *   GET  /life-events               — list all life event master records
 *   POST /life-events/select        — start a life event (generates checklist)
 *   GET  /life-events/selections    — list the caller's active selections
 *   GET  /life-events/selections/:selectionId/checklist — get checklist + progress
 */
@UseGuards(JwtAuthGuard)
@Controller('life-events')
export class LifeEventController {
  constructor(private readonly lifeEventService: LifeEventService) {}

  /**
   * GET /api/v1/life-events
   * Lists all available life event types (master data catalogue).
   * Response: LifeEventDto[]
   */
  @Get()
  listLifeEvents() {
    return this.lifeEventService.listLifeEvents();
  }

  /**
   * POST /api/v1/life-events/select
   * Starts a life event for the authenticated user.
   * Auto-generates checklist_items from the event's templates in a transaction.
   * Response 201: SelectionDto (with progress counters)
   */
  @Post('select')
  @HttpCode(HttpStatus.CREATED)
  selectLifeEvent(@Req() req: AuthRequest, @Body() dto: SelectLifeEventDto) {
    return this.lifeEventService.selectLifeEvent(req.user.sub, dto);
  }

  /**
   * GET /api/v1/life-events/selections
   * Returns all selections made by the authenticated user,
   * each with progress counters (total_items, completed_items).
   * Response: SelectionDto[]
   */
  @Get('selections')
  listMySelections(@Req() req: AuthRequest) {
    return this.lifeEventService.listMySelections(req.user.sub);
  }

  /**
   * GET /api/v1/life-events/selections/:selectionId/checklist
   * Returns the full checklist for a specific selection.
   * Returns 404 if selection not found.
   * Returns 403 if selection belongs to a different user.
   * Response: SelectionWithChecklistDto
   */
  @Get('selections/:selectionId/checklist')
  getChecklist(
    @Req() req: AuthRequest,
    @Param('selectionId', ParseUUIDPipe) selectionId: string,
  ) {
    return this.lifeEventService.getChecklist(req.user.sub, selectionId);
  }
}
