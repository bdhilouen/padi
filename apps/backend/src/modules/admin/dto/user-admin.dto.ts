import { UserRoleEnum } from '../../../common/enums/index.js';

export class UserAdminDto {
  id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  role: UserRoleEnum;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}
