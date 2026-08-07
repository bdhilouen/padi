import { IsOptional, IsString, Length } from 'class-validator';

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  title?: string;
}
