import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateUserStatusDto {
  @IsNotEmpty({ message: 'is_active is required' })
  @IsBoolean({ message: 'is_active must be a boolean' })
  is_active: boolean;
}
