import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ChatSession } from './entities/chat-session.entity.js';
import { ChatMessage } from './entities/chat-message.entity.js';
import { UsersService } from '../users/users.service.js';
import { DashboardService } from '../dashboard/dashboard.service.js';
import { DeadlineService } from '../timeline-reminder/deadline.service.js';
import { DocumentsService } from '../document-vault/documents.service.js';
import { StatusEnum } from '../../common/enums/index.js';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepo: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly dashboardService: DashboardService,
    private readonly deadlineService: DeadlineService,
    private readonly documentsService: DocumentsService,
  ) {}

  async createSession(userId: string, title?: string) {
    const session = this.sessionRepo.create({
      userId,
      title: title || 'Untitled',
    });
    const saved = await this.sessionRepo.save(session);
    return {
      id: saved.id,
      title: saved.title,
      created_at: saved.createdAt,
      updated_at: saved.updatedAt,
    };
  }

  async listSessions(userId: string) {
    const sessions = await this.sessionRepo.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
    return sessions.map((s) => ({
      id: s.id,
      title: s.title,
      created_at: s.createdAt,
      updated_at: s.updatedAt,
    }));
  }

  private async verifyOwnership(userId: string, sessionId: string) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId, userId },
    });
    if (!session) {
      throw new NotFoundException('Chat session not found');
    }
    return session;
  }

  async getMessages(userId: string, sessionId: string) {
    await this.verifyOwnership(userId, sessionId);
    const messages = await this.messageRepo.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });
    return messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      created_at: m.createdAt,
    }));
  }

  async sendMessage(userId: string, sessionId: string, message: string) {
    const session = await this.verifyOwnership(userId, sessionId);

    const userMessage = this.messageRepo.create({
      sessionId,
      role: 'user',
      content: message,
    });
    await this.messageRepo.save(userMessage);

    const userContext = await this.buildUserContext(userId);
    let replyText =
      'Maaf, layanan AI sedang tidak tersedia saat ini. Silakan coba beberapa saat lagi.';

    try {
      const response = await this.callLangflow(message, sessionId, userContext);
      // Confirmed response path from live test:
      // outputs[0].outputs[0].outputs.message.message
      const responseData = response.data as {
        outputs?: {
          outputs?: {
            outputs?: {
              message?: {
                message?: string;
                type?: string;
              };
            };
          }[];
        }[];
      };
      const aiText =
        responseData?.outputs?.[0]?.outputs?.[0]?.outputs?.message?.message;

      if (typeof aiText === 'string' && aiText.trim().length > 0) {
        replyText = aiText;
      } else {
        this.logger.warn(
          'Langflow response shape mismatch or empty reply — using fallback message',
        );
      }
    } catch (error) {
      this.logger.error('Error calling Langflow', error);
    }

    const assistantMessage = this.messageRepo.create({
      sessionId,
      role: 'assistant',
      content: replyText,
    });
    await this.messageRepo.save(assistantMessage);

    session.updatedAt = new Date();
    await this.sessionRepo.save(session);

    return {
      id: assistantMessage.id,
      role: 'assistant',
      content: replyText,
      created_at: assistantMessage.createdAt,
    };
  }

  async deleteSession(userId: string, sessionId: string) {
    const session = await this.verifyOwnership(userId, sessionId);
    await this.sessionRepo.softRemove(session);
    return { message: 'Session deleted successfully' };
  }

  private async buildUserContext(userId: string): Promise<string> {
    const lines: string[] = [];

    try {
      const profile = await this.usersService.getProfile(userId);
      if (profile) {
        lines.push(`Nama: ${profile.full_name}`);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to fetch user profile for context: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      const dashboard = await this.dashboardService.getDashboard(userId);
      let active = 0,
        warning = 0,
        expired = 0;
      const warningItems: string[] = [];
      const expiredItems: string[] = [];

      for (const item of dashboard) {
        if (item.status === StatusEnum.ACTIVE) active++;
        else if (item.status === StatusEnum.WARNING) {
          warning++;
          warningItems.push(item.service_name);
        } else if (item.status === StatusEnum.EXPIRED) {
          expired++;
          expiredItems.push(item.service_name);
        }
      }

      const warningStr =
        warningItems.length > 0 ? ` (Layanan: ${warningItems.join(', ')})` : '';
      const expiredStr =
        expiredItems.length > 0 ? ` (Layanan: ${expiredItems.join(', ')})` : '';

      lines.push(
        `Status layanan: ${active} aktif, ${warning} peringatan${warningStr}, ${expired} kedaluwarsa${expiredStr}`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to fetch dashboard for context: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      const deadlines = await this.deadlineService.listDeadlines(userId, {});
      if (deadlines?.data?.length > 0) {
        const soonest = deadlines.data
          .slice(0, 3)
          .map((d) => `${d.title} (${d.due_date})`)
          .join(', ');
        lines.push(`Tagihan/Deadline terdekat: ${soonest}`);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to fetch deadlines for context: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      const docs = await this.documentsService.listMyDocuments(userId);
      if (docs && docs.length > 0) {
        const docNames = docs.map((d) => d.document_type).join(', ');
        lines.push(`Dokumen tersimpan di akun: ${docNames}`);
      } else {
        lines.push(`Dokumen tersimpan di akun: Belum ada dokumen`);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to fetch documents for context: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return lines.join('\n');
  }

  private async callLangflow(
    message: string,
    sessionId: string,
    userContext: string,
  ) {
    const baseUrl = this.configService.get<string>('LANGFLOW_BASE_URL');
    const flowId = this.configService.get<string>('LANGFLOW_FLOW_ID');
    const apiKey = this.configService.get<string>('LANGFLOW_API_KEY');

    const url = `${baseUrl}/api/v1/run/${flowId}`;
    const headers = { 'x-api-key': apiKey, 'Content-Type': 'application/json' };
    const data = {
      input_value: message,
      input_type: 'chat',
      output_type: 'chat',
      session_id: sessionId,
      tweaks: {
        'TextInput-Hrc0u': { input_value: userContext },
      },
    };

    return await this.httpService.axiosRef.post(url, data, { headers });
  }
}
