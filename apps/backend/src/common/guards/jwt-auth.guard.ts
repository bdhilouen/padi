import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard — validates the Bearer token on every protected route.
 *
 * Uses the 'jwt' Passport strategy registered in AuthModule.
 * On success, attaches the decoded JWT payload to request.user:
 *   { sub: user_id, email, role }
 *
 * Usage:
 *   \@UseGuards(JwtAuthGuard)
 *   \@Get('protected-route')
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
