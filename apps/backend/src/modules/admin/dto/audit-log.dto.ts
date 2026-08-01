import { ServiceNameEnum } from '../../../common/enums/index.js';

export class AuditLogDto {
  id: string;
  user_id: string | null;
  action: string;
  service_accessed: ServiceNameEnum | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}
