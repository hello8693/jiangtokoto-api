import { Module } from '@nestjs/common';
import { MemesController } from './memes.controller';
import { MemesService } from './memes.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 3600 * 1000, // 1小时缓存
      max: 100, // 最多缓存100个条目
    }),
  ],
  controllers: [MemesController],
  providers: [MemesService],
})
export class MemesModule {}
