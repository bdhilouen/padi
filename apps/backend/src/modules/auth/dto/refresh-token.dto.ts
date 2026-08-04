import { IsNotEmpty, IsString } from 'class-validator';

/**
 * POST /auth/refresh
 *
 * Request body shape from Postman collection:
 *   { refreshToken }
 */
export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
