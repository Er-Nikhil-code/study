import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      "http://localhost:3000",
      "https://codify.today",
      "https://www.codify.today",
      "https://study-ten-coral.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.setGlobalPrefix("api");

  const port = Number(process.env.PORT) || 3001;

  await app.listen(port);

  console.log(`🚀 Server listening on port ${port}`);
  console.log(`📚 API available at /api`);
  console.log(`🛡️ Rate limiting enabled`);
}

bootstrap();