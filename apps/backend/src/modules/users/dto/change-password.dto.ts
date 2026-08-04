import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

/**
 * PATCH /users/me/password
 *
 * All three fields are required:
 *   - old_password:     verified against the stored bcrypt hash before change
 *   - new_password:     must meet the same strength rules as registration
 *   - confirm_password: must equal new_password (validated in service)
 *
 * The confirm_password cross-field check is intentionally done in the service
 * (not a custom decorator) to keep the validator simple and the error message
 * consistent with the rest of the API.
 */
export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  old_password: string;

  @IsString()
  @Length(8, 100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, {
    message:
      'new_password must contain at least one uppercase, one lowercase, one digit, and one special character',
  })
  new_password: string;

  @IsString()
  @IsNotEmpty()
  confirm_password: string;
}
