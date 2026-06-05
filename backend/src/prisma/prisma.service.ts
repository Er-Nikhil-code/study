import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private logger = new Logger(PrismaService.name);

  constructor() {
    super();
  }

  async onModuleInit() {
    // Retry logic for database connection (useful for Railway startup)
    const maxRetries = 15;
    const retryDelay = 3000; // 3 seconds between retries
    const dbUrl = process.env.DATABASE_URL?.substring(0, 50) + "...";

    this.logger.log(`🔄 Attempting to connect to database: ${dbUrl}`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(
          `📡 Database connection attempt ${attempt}/${maxRetries}...`,
        );
        await this.$connect();
        this.logger.log("✅ Database connected successfully");
        return;
      } catch (error: any) {
        this.logger.warn(
          `⚠️  Attempt ${attempt}/${maxRetries} failed: ${error?.message}. Retrying in ${retryDelay / 1000}s...`,
        );

        if (attempt === maxRetries) {
          this.logger.error(
            `❌ Failed to connect to database after ${maxRetries} retry attempts (${(maxRetries * retryDelay) / 1000}s total)`,
          );
          throw error;
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log("Database disconnected");
  }
}
