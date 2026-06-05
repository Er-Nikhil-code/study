import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: [configService.get('APP_URL', 'http://localhost:3000')],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  const port = configService.get<number>('API_PORT', 3001);

  await app.listen(port, () => {
    console.log(`✅ Server is running on http://localhost:${port}`);
    console.log(`📚 API available at http://localhost:${port}/api`);
  });
}

bootstrap();
