import { IsOptional, IsString, Length } from 'class-validator';

/**
 * PATCH /users/me
 *
 * Only full_name and phone_number may be updated via this endpoint.
 * email, nik, and role are immutable through self-service routes.
 * At least one field must be present (enforced at the service level).
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 150)
  full_name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  phone_number?: string;
}
