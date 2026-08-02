import { IsNotEmpty, IsString, Matches } from 'class-validator';

/**
 * POST /auth/login
 *
 * Request body shape from Postman collection:
 *   { nik, password }
 *
 * Login uses NIK (not email) as the identifier, matching FR-012.
 */
export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{16}$/, { message: 'NIK must be exactly 16 digits' })
  nik: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
