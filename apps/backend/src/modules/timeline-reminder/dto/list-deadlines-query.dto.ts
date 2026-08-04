import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ServiceNameEnum, StatusEnum } from '../../../common/enums/index.js';

const DEADLINE_SORT_VALUES = [
  'due_date',
  '-due_date',
  'created_at',
  '-created_at',
  'service_name',
  '-service_name',
  'status',
  '-status',
  'title',
  '-title',
] as const;

export type DeadlineSort = (typeof DEADLINE_SORT_VALUES)[number];

export class ListDeadlinesQueryDto {
  @IsOptional()
  @IsEnum(StatusEnum, { message: 'status must be ACTIVE, WARNING, or EXPIRED' })
  status?: StatusEnum;

  @IsOptional()
  @IsEnum(ServiceNameEnum, {
    message: 'service_name must be a supported service name',
  })
  service_name?: ServiceNameEnum;

  @IsOptional()
  @IsDateString({}, { message: 'due_date_from must be a valid ISO date' })
  due_date_from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'due_date_to must be a valid ISO date' })
  due_date_to?: string;

  @IsOptional()
  @IsIn(DEADLINE_SORT_VALUES, {
    message:
      'sort must be one of due_date, created_at, service_name, status, title, or the same field prefixed with -',
  })
  sort?: DeadlineSort;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page must be an integer' })
  @Min(1, { message: 'page must be at least 1' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(100, { message: 'limit must not exceed 100' })
  limit?: number;
}
