import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, MoreThan, Repository } from 'typeorm';
import { CryptoService } from '../../common/crypto/crypto.service.js';
import { UserRoleEnum } from '../../common/enums/index.js';
import { RefreshToken } from './entities/refresh-token.entity.js';
import { UserSession } from './entities/user-session.entity.js';
import { User } from '../users/entities/user.entity.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import type { JwtPayload } from './strategies/jwt.strategy.js';

const REFRESH_TOKEN_TTL_DAYS = 7;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  role: UserRoleEnum;
  created_at: Date;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,

    @InjectRepository(UserSession)
    private readonly sessionRepo: Repository<UserSession>,

    @InjectDataSource()
    private readonly dataSource: DataSource,

    private readonly cryptoService: CryptoService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Register ────────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<RegisterResponse> {
    const nikHash = this.cryptoService.hashNik(dto.nik);

    // Check for duplicate NIK or email before touching the DB
    const existing = await this.userRepo.findOne({
      where: [{ nikHash }, { email: dto.email }],
      withDeleted: false,
    });

    if (existing) {
      throw new ConflictException(
        'A user with this NIK or email already exists',
      );
    }

    const passwordHash = await this.cryptoService.hashPassword(dto.password);
    const encryptionKey = this.cryptoService.getNikEncryptionKey();

    // Use a transaction to ensure both the user row and the encrypted NIK
    // are written atomically. pgp_sym_encrypt runs inside the DB via raw SQL.
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = (await queryRunner.query(
        `
        INSERT INTO users
          (nik_encrypted, nik_hash, email, password_hash, full_name, phone_number)
        VALUES
          (pgp_sym_encrypt($1::text, $2), $3, $4, $5, $6, $7)
        RETURNING id, created_at
        `,
        [
          dto.nik,
          encryptionKey,
          nikHash,
          dto.email,
          passwordHash,
          dto.full_name,
          dto.phone_number ?? null,
        ],
      )) as Array<{ id: string; created_at: Date }>;

      await queryRunner.commitTransaction();

      const newUser = result[0];
      return {
        id: newUser.id,
        email: dto.email,
        full_name: dto.full_name,
        phone_number: dto.phone_number ?? null,
        role: UserRoleEnum.USER,
        created_at: newUser.created_at,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();

      // Surface duplicate key violations as 409 Conflict
      if (
        (error as NodeJS.ErrnoException & { code?: string }).code === '23505'
      ) {
        throw new ConflictException(
          'A user with this NIK or email already exists',
        );
      }

      throw new InternalServerErrorException('Registration failed');
    } finally {
      await queryRunner.release();
    }
  }

  // ─── Login ───────────────────────────────────────────────────────────────

  async login(
    dto: LoginDto,
    ipAddress: string | null,
    userAgent: string | null,
  ): Promise<TokenPair> {
    const nikHash = this.cryptoService.hashNik(dto.nik);

    const user = await this.userRepo.findOne({
      where: { nikHash },
      withDeleted: false,
    });

    if (!user || !user.isActive) {
      // Deliberate vague message — do not reveal whether the NIK exists
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await this.cryptoService.verifyPassword(
      dto.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create a session record for this device
    const session = this.sessionRepo.create({
      userId: user.id,
      ipAddress,
      userAgent,
      deviceName: userAgent ? userAgent.slice(0, 255) : null,
      isActive: true,
    });

    const savedSession = await this.sessionRepo.save(session);

    return this.issueTokenPair(user, savedSession.id);
  }

  // ─── Refresh ─────────────────────────────────────────────────────────────

  async refresh(rawRefreshToken: string): Promise<TokenPair> {
    const tokenHash = this.cryptoService.hashToken(rawRefreshToken);

    const stored = await this.refreshTokenRepo.findOne({
      where: {
        tokenHash,
        revokedAt: IsNull(), // revoked_at IS NULL
        expiresAt: MoreThan(new Date()), // expires_at > now()
      },
      relations: { user: true },
    });

    if (!stored || !stored.user || !stored.user.isActive) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    // Token rotation — revoke the old token immediately
    stored.revokedAt = new Date();
    await this.refreshTokenRepo.save(stored);

    return this.issueTokenPair(stored.user, stored.userSessionId);
  }

  // ─── Logout ──────────────────────────────────────────────────────────────

  async logout(rawRefreshToken: string): Promise<{ message: string }> {
    const tokenHash = this.cryptoService.hashToken(rawRefreshToken);

    const stored = await this.refreshTokenRepo.findOne({
      where: { tokenHash },
    });

    if (!stored) {
      // Idempotent — don't reveal whether the token ever existed
      return { message: 'Logged out successfully' };
    }

    const now = new Date();

    // Revoke the refresh token
    stored.revokedAt = now;
    await this.refreshTokenRepo.save(stored);

    // Mark the associated session as inactive
    if (stored.userSessionId) {
      await this.sessionRepo.update(
        { id: stored.userSessionId },
        { isActive: false, logoutAt: now },
      );
    }

    return { message: 'Logged out successfully' };
  }

  // ─── Revoke all tokens for a user (used when password changes or admin suspends) ─

  async revokeAllSessions(
    userId: string,
    exceptSessionId?: string | null,
  ): Promise<void> {
    if (exceptSessionId) {
      await this.dataSource.query(
        `UPDATE refresh_tokens SET revoked_at = now()
         WHERE user_id = $1 AND (user_session_id != $2 OR user_session_id IS NULL) AND revoked_at IS NULL`,
        [userId, exceptSessionId],
      );
      await this.dataSource.query(
        `UPDATE user_sessions SET is_active = false, logout_at = now()
         WHERE user_id = $1 AND id != $2 AND is_active = true`,
        [userId, exceptSessionId],
      );
    } else {
      await this.dataSource.query(
        `UPDATE refresh_tokens SET revoked_at = now()
         WHERE user_id = $1 AND revoked_at IS NULL`,
        [userId],
      );
      await this.dataSource.query(
        `UPDATE user_sessions SET is_active = false, logout_at = now()
         WHERE user_id = $1 AND is_active = true`,
        [userId],
      );
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async issueTokenPair(
    user: User,
    sessionId: string | null | undefined,
  ): Promise<TokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: sessionId ?? null,
    };

    const accessToken = this.jwtService.sign(payload);

    // Generate and store a new refresh token
    const rawToken = this.cryptoService.generateRefreshToken();
    const tokenHash = this.cryptoService.hashToken(rawToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    const refreshTokenRecord = this.refreshTokenRepo.create({
      userId: user.id,
      userSessionId: sessionId ?? null,
      tokenHash,
      expiresAt,
    });

    await this.refreshTokenRepo.save(refreshTokenRecord);

    return { accessToken, refreshToken: rawToken };
  }
}
