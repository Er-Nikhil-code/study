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
    const maxRetries = 5;
    const retryDelay = 2000; // 2 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.logger.log("✅ Database connected successfully");
        return;
      } catch (error) {
        this.logger.warn(
          `⚠️  Database connection attempt ${attempt}/${maxRetries} failed. Retrying in ${retryDelay / 1000}s...`,
        );

        if (attempt === maxRetries) {
          this.logger.error(
            "❌ Failed to connect to database after all retry attempts",
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
