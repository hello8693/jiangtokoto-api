import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const port = process.env.PORT ?? 3000;

  // 启用CORS
  app.enableCors();

  // 启用压缩
  app.use(compression());

  await app.listen(port);
  logger.log(`服务器已启动，运行于: http://localhost:${port}`);
  logger.log(`随机表情包API端点: http://localhost:${port}/memes/random`);
}

bootstrap().catch((err) => console.error('Failed to start server:', err));
