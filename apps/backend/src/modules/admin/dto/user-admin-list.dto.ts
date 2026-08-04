import { UserAdminDto } from './user-admin.dto.js';

export class UserAdminListDto {
  data: UserAdminDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}
