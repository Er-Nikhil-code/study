import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";

async function bootstrap() {
  const logger = new Logger("Bootstrap");

  // Validate critical environment variables
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "your-secret-key") {
    logger.error(
      "❌ FATAL: JWT_SECRET is not configured or is using the default value. Set a strong secret in your environment.",
    );
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }

  const app = await NestFactory.create(AppModule);

  // Auto-publish any stuck DRAFT tests
  try {
    const prisma = app.get(PrismaService);
    await prisma.test.updateMany({ where: { status: "DRAFT" }, data: { status: "PUBLISHED" } });
    logger.log("✅ Auto-published all DRAFT tests");
  } catch (err) {
    logger.error("Failed to auto-publish draft tests", err);
  }

  // Parse CORS origins from environment variable, with sensible defaults
  const defaultOrigins = [
    "http://localhost:3000",
    "https://www.codify.today",
  ];

  const corsOriginsEnv = process.env.CORS_ORIGINS;
  const allowedOrigins = corsOriginsEnv
    ? corsOriginsEnv
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean)
    : defaultOrigins;

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        return callback(null, true);
      }

      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin === "https://codify.today" ||
        origin === "https://www.codify.today"
      ) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.setGlobalPrefix("api");

  const port = Number(process.env.PORT) || 3001;

  await app.listen(port);

  logger.log(`🚀 Server listening on port ${port}`);
  logger.log(
    `🌐 CORS origins: ${allowedOrigins.join(", ")} + *.vercel.app`,
  );
}

bootstrap();
