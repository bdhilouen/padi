import {
  Body,
  Controller,
  Delete,
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
import { ChatService } from './chat.service.js';
import { CreateSessionDto } from './dto/create-session.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';

/** Authenticated request type — request.user is populated by JwtAuthGuard. */
type AuthRequest = Request & { user: JwtPayload };

/**
 * ChatController — thin routing layer for /chat endpoints.
 *
 * All routes are protected by JwtAuthGuard.
 * User identity is always taken from request.user.sub (JWT payload),
 * never from a client-supplied body or query param.
 */
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /** POST /api/v1/chat/sessions — Creates a new chat session. */
  @Post('sessions')
  createSession(@Req() req: AuthRequest, @Body() dto: CreateSessionDto) {
    return this.chatService.createSession(req.user.sub, dto.title);
  }

  /** GET /api/v1/chat/sessions — Lists the user's chat sessions. */
  @Get('sessions')
  listSessions(@Req() req: AuthRequest) {
    return this.chatService.listSessions(req.user.sub);
  }

  /** GET /api/v1/chat/sessions/:sessionId/messages — Returns messages for a session. */
  @Get('sessions/:sessionId/messages')
  getMessages(
    @Req() req: AuthRequest,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.chatService.getMessages(req.user.sub, sessionId);
  }

  /**
   * POST /api/v1/chat/sessions/:sessionId/messages
   * Sends a message, calls the AI service, and returns the assistant's reply.
   */
  @Post('sessions/:sessionId/messages')
  sendMessage(
    @Req() req: AuthRequest,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(req.user.sub, sessionId, dto.message);
  }

  /** DELETE /api/v1/chat/sessions/:sessionId — Soft-deletes a session. */
  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  deleteSession(
    @Req() req: AuthRequest,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.chatService.deleteSession(req.user.sub, sessionId);
  }
}
