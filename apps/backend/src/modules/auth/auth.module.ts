import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../../common/common.module.js';
import { RefreshToken } from './entities/refresh-token.entity.js';
import { UserSession } from './entities/user-session.entity.js';
import { User } from '../users/entities/user.entity.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [
    // Entities this module owns + User (needed for login lookup)
    TypeOrmModule.forFeature([User, UserSession, RefreshToken]),

    PassportModule,

    // JWT module configured with the secret and default expiry from env
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // Cast required: @nestjs/jwt v11 types expiresIn as StringValue (ms lib)
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') as unknown as number,
        },
      }),
    }),

    // Provides CryptoService
    CommonModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [
    AuthService,    // Exported so other modules can call revokeAllUserTokens
    JwtModule,      // Exported so other modules can use JwtService if needed
  ],
})
export class AuthModule {}
