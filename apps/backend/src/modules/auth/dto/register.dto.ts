import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

/**
 * POST /auth/register
 *
 * Request body shape from Postman collection:
 *   { nik, email, password, full_name, phone_number? }
 */
export class RegisterDto {
  /**
   * NIK (Nomor Induk Kependudukan) — 16-digit Indonesian national ID number.
   * Never stored in plaintext; will be encrypted (pgp_sym_encrypt) and
   * hashed (SHA-256) before being persisted.
   */
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{16}$/, { message: 'NIK must be exactly 16 digits' })
  nik: string;

  @IsEmail({}, { message: 'email must be a valid email address' })
  email: string;

  /**
   * Minimum 8 characters, at least one uppercase letter, one lowercase
   * letter, one digit, and one special character.
   */
  @IsString()
  @Length(8, 100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, {
    message:
      'password must contain at least one uppercase, one lowercase, one digit, and one special character',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 150)
  full_name: string;

  @IsOptional()
  @IsString()
  @Length(1, 20)
  phone_number?: string;
}
