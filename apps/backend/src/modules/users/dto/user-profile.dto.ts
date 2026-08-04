import { UserRoleEnum } from '../../../common/enums/index.js';

/**
 * Response shape for GET /users/me and PATCH /users/me.
 *
 * Sensitive fields deliberately omitted:
 *   - nik_encrypted, nik_hash  (security — never sent to client)
 *   - password_hash            (security — never sent to client)
 *   - deleted_at               (internal soft-delete marker)
 */
export class UserProfileDto {
  id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  role: UserRoleEnum;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
