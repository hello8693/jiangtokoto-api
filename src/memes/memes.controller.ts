import {
  Controller,
  Get,
  Header,
  Res,
  Logger,
  HttpStatus,
  StreamableFile,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { Response } from 'express';
import { MemesService } from './memes.service';

@Controller('memes')
export class MemesController {
  private readonly logger = new Logger(MemesController.name);

  constructor(private readonly memesService: MemesService) {}

  @Get('random')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  async getRandomMeme(
    @Res({ passthrough: true }) res: Response,
    @Query('width') width?: number,
    @Query('height') height?: number,
  ): Promise<StreamableFile | void> {
    const meme = this.memesService.getRandomMeme();

    if (!meme) {
      this.logger.warn('No meme files available');
      res.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: '没有找到表情包，请先上传一些表情包图片到 public/memes 目录',
      });
      return;
    }

    try {
      // 处理图片，支持尺寸调整
      const options = {};
      if (width) options['width'] = Number(width);
      if (height) options['height'] = Number(height);

      const processedMeme = await this.memesService.getProcessedMeme(
        meme.path,
        options,
      );

      if (!processedMeme) {
        throw new Error('Failed to process meme');
      }

      // 对文件名进行编码，确保Content-Disposition头部符合规范
      const encodedFilename = encodeURIComponent(processedMeme.filename);
      
      res.set({
        'Content-Type': processedMeme.mimeType,
        'Content-Length': processedMeme.size,
        'Content-Disposition': `inline; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
        // 添加ETag可以支持条件请求
        ETag: `"${meme.hash}"`,
      });

      return new StreamableFile(processedMeme.buffer);
    } catch (error) {
      this.logger.error(`Error serving meme file: ${(error as Error).message}`);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: '服务器内部错误',
      });
    }
  }

  @Get('count')
  @UseInterceptors(CacheInterceptor)
  getMemesCount() {
    return {
      count: this.memesService.getMemeFilesCount(),
    };
  }
}
