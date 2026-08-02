import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRoleEnum } from '../../common/enums/index.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import type { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { AdminService } from './admin.service.js';
import { ListUsersQueryDto } from './dto/list-users-query.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto.js';

type AuthRequest = Request & { user: JwtPayload };

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRoleEnum.ADMINISTRATOR)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  listUsers(@Query() query: ListUsersQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Get('users/:id')
  getUserDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Patch('users/:id/status')
  @HttpCode(HttpStatus.OK)
  updateUserStatus(
    @Req() req: AuthRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    const ipAddress = req.ip || (req.socket?.remoteAddress ?? null);
    const userAgent = req.headers['user-agent'] ?? null;

    return this.adminService.updateUserStatus(
      req.user.sub,
      id,
      dto,
      ipAddress,
      userAgent,
    );
  }

  @Get('audit-logs')
  listAuditLogs(@Query() query: ListAuditLogsQueryDto) {
    return this.adminService.listAuditLogs(query);
  }
}
