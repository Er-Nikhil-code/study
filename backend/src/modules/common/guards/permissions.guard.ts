import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true; // No specific permissions required
    }

    const request = context.switchToHttp().getRequest();
    const jwtUser = request.user; // contains sub, email, role

    if (!jwtUser) {
      throw new ForbiddenException("User not authenticated");
    }

    // System ADMIN bypasses all permission checks
    if (jwtUser.role === "ADMIN") {
      return true;
    }

    // Fetch the user's custom role from the database to check live permissions
    const user = await this.prisma.user.findUnique({
      where: { id: jwtUser.sub },
      include: { custom_role: true },
    });

    if (!user) {
      throw new ForbiddenException("User not found in database");
    }

    // Default system roles (TEACHER, INTERN, STUDENT) might have base permissions,
    // but the system relies primarily on custom_roles for explicit privilege grants.
    // If we want hardcoded defaults for TEACHER/INTERN, we can define them here,
    // but a pure Privilege-based architecture relies on the custom_role.

    const customRole = user.custom_role;
    if (!customRole) {
      throw new ForbiddenException(
        `Insufficient permissions. Requires one of: ${requiredPermissions.join(", ")}`,
      );
    }

    // Check if the user's custom role has ANY of the required permissions
    const rolePermissions: string[] = Array.isArray(customRole.permissions_json) 
      ? (customRole.permissions_json as string[]) 
      : [];

    const hasPermission = requiredPermissions.some((perm) =>
      rolePermissions.includes(perm)
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient permissions. Requires one of: ${requiredPermissions.join(", ")}`,
      );
    }

    // Optional: inject the loaded permissions into the request for downstream controllers
    request.user.permissions = rolePermissions;

    return true;
  }
}
