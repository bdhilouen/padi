import { SetMetadata } from '@nestjs/common';
import { UserRoleEnum } from '../enums/index.js';

export const ROLES_KEY = 'roles';

/**
 * Decorator to restrict a route to specific roles.
 * Must be combined with RolesGuard.
 *
 * @example
 * \@Roles(UserRoleEnum.ADMINISTRATOR)
 * \@UseGuards(JwtAuthGuard, RolesGuard)
 * \@Get('admin/report')
 * getAdminReport() { ... }
 */
export const Roles = (...roles: UserRoleEnum[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
