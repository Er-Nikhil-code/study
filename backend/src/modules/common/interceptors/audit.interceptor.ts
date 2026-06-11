import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const method = req.method;

    // Only log mutating requests
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: (resData: any) => this.logActivity(req, resData),
        error: () => {} // We only log successful operations by default
      }),
    );
  }

  private async logActivity(req: any, resData: any) {
    try {
      // 1. Identify Actor (Requires the route to be protected by JwtAuthGuard)
      const actorId = req.user?.id || req.user?.sub;
      if (!actorId) {
        return; // Skip logging if user is not authenticated (e.g. public endpoints)
      }

      // 2. Identify Action
      let action = 'UNKNOWN';
      if (req.method === 'POST') action = 'CREATE';
      else if (req.method === 'PATCH' || req.method === 'PUT') action = 'UPDATE';
      else if (req.method === 'DELETE') action = 'DELETE';

      // 3. Identify Entity Type from URL (e.g. /api/admin/courses -> admin_courses)
      const pathSegments = (req.route?.path || req.path).split('/').filter(Boolean);
      if (pathSegments[0] === 'api') pathSegments.shift(); // remove '/api'
      
      // Remove UUIDs or route params (like ':id') from segments
      const cleanSegments = pathSegments.filter((s: string) => !s.includes(':') && !/^[0-9a-fA-F-]+$/.test(s) && !/^\d+$/.test(s));
      const entityType = cleanSegments.join('_') || 'system';

      // 4. Identify Entity ID
      let entityId = req.params?.id;
      if (!entityId && resData && resData.id) entityId = resData.id;
      if (!entityId && req.body && req.body.id) entityId = req.body.id;
      if (!entityId) entityId = 'bulk_or_unknown';

      // 5. Sanitize Body
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.password) sanitizedBody.password = '***';

      await this.prisma.auditLog.create({
        data: {
          actor_id: actorId,
          action: action,
          entity_type: entityType,
          entity_id: entityId,
          after_json: sanitizedBody,
          ip_address: req.ip || req.connection?.remoteAddress,
          user_agent: req.headers['user-agent']?.substring(0, 200),
        }
      });
    } catch (err: any) {
      this.logger.warn(`Failed to create audit log: ${err.message}`);
    }
  }
}
