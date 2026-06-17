import { ExecutionContext, Injectable, Inject } from '@nestjs/common';
import { CacheInterceptor, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Reflector } from '@nestjs/core';

@Injectable()
export class UserCacheInterceptor extends CacheInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) cacheManager: any,
    reflector: Reflector,
  ) {
    super(cacheManager, reflector);
  }
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const isGetRequest = request.method === 'GET';

    if (!isGetRequest) {
      return undefined;
    }

    const url = request.url;
    // Extract user info from req.user (populated by JwtAuthGuard)
    const userId = request.user?.sub || request.user?.id || 'anonymous';
    const userRole = request.user?.role || 'anonymous';

    // Combine URL, user ID, and role for a universally unique cache key
    return `${url}:${userId}:${userRole}`;
  }
}
