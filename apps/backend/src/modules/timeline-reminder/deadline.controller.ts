import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { DeadlineService } from './deadline.service.js';
import { ListDeadlinesQueryDto } from './dto/list-deadlines-query.dto.js';

type AuthRequest = Request & { user: JwtPayload };

@UseGuards(JwtAuthGuard)
@Controller('deadlines')
export class DeadlineController {
  constructor(private readonly deadlineService: DeadlineService) {}

  @Get()
  listDeadlines(
    @Req() req: AuthRequest,
    @Query() query: ListDeadlinesQueryDto,
  ) {
    return this.deadlineService.listDeadlines(req.user.sub, query);
  }

  @Get(':deadlineId')
  getDeadline(
    @Req() req: AuthRequest,
    @Param('deadlineId', ParseUUIDPipe) deadlineId: string,
  ) {
    return this.deadlineService.getDeadline(req.user.sub, deadlineId);
  }
}
