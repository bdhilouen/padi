import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRoleEnum } from '../../../common/enums/index.js';

export interface JwtPayload {
  sub: string; // user_id (UUID)
  email: string;
  role: UserRoleEnum;
}

/**
 * JwtStrategy — validates incoming Bearer tokens.
 *
 * On success the decoded payload is attached to request.user.
 * No database query is made here — the JWT payload already carries
 * the { sub, email, role } fields needed for auth/RBAC decisions.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    // Return value becomes request.user in the route handler
    return { sub: payload.sub, email: payload.email, role: payload.role };
  }
}
