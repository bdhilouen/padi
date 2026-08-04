import { ServiceNameEnum, StatusEnum } from '../../../common/enums/index.js';

export class DeadlineDto {
  id: string;
  service_name: ServiceNameEnum;
  title: string;
  description: string | null;
  due_date: string;
  status: StatusEnum;
  created_at: Date;
  updated_at: Date;
}

export class DeadlinePaginationMetaDto {
  total: number;
  page: number;
  limit: number;
}

export class DeadlineListDto {
  data: DeadlineDto[];
  meta: DeadlinePaginationMetaDto;
}
