import { AuditLogDto } from './audit-log.dto.js';

export class AuditLogListDto {
  data: AuditLogDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}
