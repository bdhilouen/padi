import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class ListAuditLogsQueryDto {
  @IsOptional()
  @IsDateString({}, { message: 'from must be a valid ISO date' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'to must be a valid ISO date' })
  to?: string;

  @IsOptional()
  @IsUUID('4', { message: 'user_id must be a valid UUID' })
  user_id?: string;

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
