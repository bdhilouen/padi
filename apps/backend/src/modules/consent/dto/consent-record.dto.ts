import {
  ConsentStatusEnum,
  ServiceNameEnum,
} from '../../../common/enums/index.js';

/**
 * Response shape for a single consent record.
 *
 * Only safe, UI-relevant fields are included.
 * user_id is intentionally omitted (caller is always the authenticated user).
 * Internal ORM fields (created_at, etc.) are excluded.
 */
export class ConsentRecordDto {
  id: string;
  service_name: ServiceNameEnum;
  status: ConsentStatusEnum;
  granted_at: Date | null;
  revoked_at: Date | null;
}
