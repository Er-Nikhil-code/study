import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

/**
 * Self-ping cron job to prevent the Railway server from sleeping.
 * Pings the health endpoint every 5 minutes.
 */
@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);

  constructor(private configService: ConfigService) {}

  @Cron("*/5 * * * *") // Every 5 minutes
  async selfPing(): Promise<void> {
    const selfUrl =
      this.configService.get<string>("SELF_PING_URL") ||
      this.configService.get<string>("APP_URL");

    if (!selfUrl) {
      this.logger.debug(
        "No SELF_PING_URL or APP_URL configured — skipping self-ping",
      );
      return;
    }

    // Determine the API base: if it looks like a frontend URL, build the API path
    const apiPort = this.configService.get<number>("API_PORT", 3001);
    let pingUrl: string;

    // If SELF_PING_URL is explicitly set, use it directly
    if (this.configService.get<string>("SELF_PING_URL")) {
      pingUrl = `${selfUrl}/api/health/ping`;
    } else {
      // APP_URL is the frontend URL — for Railway, the backend serves on the same domain
      // Use the PORT env var that Railway provides
      const port = this.configService.get<number>("PORT", apiPort);
      pingUrl = `http://0.0.0.0:${port}/api/health/ping`;
    }

    try {
      const response = await axios.get(pingUrl, { timeout: 10000 });
      this.logger.debug(
        `✅ Self-ping OK: ${response.data?.status} (uptime: ${response.data?.uptime_seconds}s)`,
      );
    } catch (error: any) {
      this.logger.warn(
        `⚠️  Self-ping failed: ${error?.message || "Unknown error"}`,
      );
    }
  }
}
