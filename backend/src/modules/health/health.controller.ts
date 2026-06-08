import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";

@Controller("health")
export class HealthController {
  private readonly startTime = Date.now();

  /**
   * GET /api/health/ping
   * Public health check endpoint — no auth required.
   * Used by frontend ServerPing and keep-alive cron to prevent Railway from sleeping.
   */
  @Get("ping")
  @HttpCode(HttpStatus.OK)
  ping() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }
}
