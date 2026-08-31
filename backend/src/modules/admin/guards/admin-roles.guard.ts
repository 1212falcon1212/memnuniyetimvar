import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_ROLES_KEY } from '../decorators/admin-roles.decorator';
import { AdminRole, AdminUser } from '../../users/entities/admin-user.entity';

@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(ADMIN_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) return true;

    const request = context.switchToHttp().getRequest<{ admin?: AdminUser }>();
    const admin = request.admin;

    if (!admin || !requiredRoles.includes(admin.role)) {
      throw new ForbiddenException({
        code: 'ADMIN_ROLE_FORBIDDEN',
        message: 'Bu islem icin yetkiniz yok',
      });
    }

    return true;
  }
}
