import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../../common/common.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { RefreshToken } from '../auth/entities/refresh-token.entity.js';
import { UserSession } from '../auth/entities/user-session.entity.js';
import { User } from './entities/user.entity.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [
    // Repositories this module needs directly
    TypeOrmModule.forFeature([User, UserSession, RefreshToken]),

    // CryptoService (password hashing / verification)
    CommonModule,

    // AuthService.revokeAllUserTokens — exported by AuthModule
    AuthModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
