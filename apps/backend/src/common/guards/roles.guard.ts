import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { UserRoleEnum } from '../enums/index.js';

/**
 * RolesGuard — checks that the authenticated user's role matches the
 * roles declared by \@Roles() on the route.
 *
 * Must be used AFTER JwtAuthGuard so that request.user is already populated.
 * Role is read from the JWT payload — no extra database query needed.
 *
 * Usage:
 *   \@UseGuards(JwtAuthGuard, RolesGuard)
 *   \@Roles(UserRoleEnum.ADMINISTRATOR)
 *   \@Get('admin-only')
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRoleEnum[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @Roles() on this route — allow any authenticated user through
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<{ user: { role: UserRoleEnum } }>();

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
