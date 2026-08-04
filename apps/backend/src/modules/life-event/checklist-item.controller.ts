import {
  Body,
  Controller,
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
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto.js';
import { LifeEventService } from './life-event.service.js';

/** Authenticated request type — req.user populated by JwtAuthGuard. */
type AuthRequest = Request & { user: JwtPayload };

/**
 * ChecklistItemController — handles checklist item mutations.
 *
 * Mounted at /checklist-items to match the Postman contract.
 * All routes protected by JwtAuthGuard.
 * Ownership is verified inside the service via the selection's user_id.
 */
@UseGuards(JwtAuthGuard)
@Controller('checklist-items')
export class ChecklistItemController {
  constructor(private readonly lifeEventService: LifeEventService) {}

  /**
   * PATCH /api/v1/checklist-items/:itemId
   * Marks or unmarks a checklist item as completed (FR-008).
   * Returns 404 if item not found.
   * Returns 403 if item belongs to a different user's selection.
   * Response 200: ChecklistItemDto
   */
  @Patch(':itemId')
  @HttpCode(HttpStatus.OK)
  toggleItem(
    @Req() req: AuthRequest,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateChecklistItemDto,
  ) {
    return this.lifeEventService.toggleChecklistItem(req.user.sub, itemId, dto);
  }
}
