import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as sharp from 'sharp';
import * as crypto from 'crypto';

interface MemeInfo {
  path: string;
  width: number;
  height: number;
  size: number;
  format: string;
  hash: string;
}

interface ProcessedMeme {
  buffer: Buffer;
  mimeType: string;
  filename: string;
  size: number;
}

@Injectable()
export class MemesService implements OnModuleInit {
  private readonly logger = new Logger(MemesService.name);
  private readonly memesDirectory = path.join(
    process.cwd(),
    process.env.IMAGES_DIRECTORY || 'public/images/images',
  );
  private memeFiles: MemeInfo[] = [];
  private readonly validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  private readonly CACHE_TTL = parseInt(process.env.CACHE_TTL || '3600000', 10); // 从环境变量读取缓存时间，默认1小时
  private lastReloadTime = 0;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async onModuleInit() {
    await this.loadMemeFiles();
    this.logger.log(`Loaded ${this.memeFiles.length} meme files`);

    // 设置文件监视器，检测文件夹变化自动更新缓存，但限制更新频率
    fs.watch(this.memesDirectory, () => {
      // 防止短时间内多次触发更新
      const now = Date.now();
      if (now - this.lastReloadTime > 5000) {
        // 5秒内不重复加载
        this.lastReloadTime = now;
        void this.loadMemeFiles().then(() => {
          this.logger.log(
            `Reloaded ${this.memeFiles.length} meme files due to directory changes`,
          );
        });
      }
    }).on('error', (error) => {
      this.logger.error(`Error watching meme directory: ${error.message}`);
    });
  }

  private async loadMemeFiles() {
    try {
      await fs.ensureDir(this.memesDirectory);
      const files = await fs.readdir(this.memesDirectory);

      // 并行处理所有文件信息
      const memeInfoPromises = files
        .filter((file) => {
          const ext = path.extname(file).toLowerCase();
          return this.validExtensions.includes(ext);
        })
        .map(async (file) => {
          const filePath = path.join(this.memesDirectory, file);
          try {
            const stats = await fs.stat(filePath);

            // 只为静态图片获取元数据
            const ext = path.extname(file).toLowerCase();
            let metadata = { width: 0, height: 0, format: '' };

            if (ext !== '.gif') {
              try {
                metadata = await sharp(filePath).metadata();
              } catch (err) {
                this.logger.warn(
                  `Could not get metadata for ${file}: ${(err as Error).message}`,
                );
              }
            }

            // 计算文件哈希值用于缓存键
            const fileBuffer = await fs.readFile(filePath);
            const hash = crypto
              .createHash('md5')
              .update(fileBuffer)
              .digest('hex');

            return {
              path: filePath,
              width: metadata.width || 0,
              height: metadata.height || 0,
              size: stats.size,
              format: metadata.format || ext.substring(1),
              hash,
            } as MemeInfo;
          } catch (error) {
            this.logger.warn(
              `Skipping invalid file ${file}: ${(error as Error).message}`,
            );
            return null;
          }
        });

      // 等待所有文件信息处理完成
      const memeInfoResults = await Promise.all(memeInfoPromises);
      this.memeFiles = memeInfoResults.filter(
        (info): info is MemeInfo => info !== null,
      );

      // 预热一部分图片缓存
      await this.preloadPopularMemes();
    } catch (error) {
      this.logger.error(
        `Failed to load meme files: ${(error as Error).message}`,
      );
      this.memeFiles = [];
    }
  }

  // 预加载一些热门图片到缓存中
  private async preloadPopularMemes() {
    try {
      // 最多预加载10张图片
      const preloadCount = Math.min(10, this.memeFiles.length);
      if (preloadCount > 0) {
        for (let i = 0; i < preloadCount; i++) {
          const meme = this.memeFiles[i];
          const cacheKey = `meme:${meme.hash}`;

          // 检查缓存中是否已存在
          const cached = await this.cacheManager.get(cacheKey);
          if (!cached) {
            // 预处理并缓存
            await this.getProcessedMeme(meme.path);
          }
        }
        this.logger.log(`Preloaded ${preloadCount} memes into cache`);
      }
    } catch (error) {
      this.logger.warn(`Meme preloading failed: ${(error as Error).message}`);
    }
  }

  getRandomMeme(): MemeInfo | null {
    if (this.memeFiles.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * this.memeFiles.length);
    return this.memeFiles[randomIndex];
  }

  async getProcessedMeme(
    memePath: string,
    options?: { width?: number; height?: number },
  ): Promise<ProcessedMeme | null> {
    try {
      const fileInfo = this.memeFiles.find((meme) => meme.path === memePath);
      if (!fileInfo) {
        return null;
      }

      // 生成缓存键，包含路径和可能的尺寸参数
      const resizeOpts = options
        ? `_w${options.width || 0}_h${options.height || 0}`
        : '';
      const cacheKey = `meme:${fileInfo.hash}${resizeOpts}`;

      // 尝试从缓存获取
      const cachedMeme = await this.cacheManager.get<ProcessedMeme>(cacheKey);
      if (cachedMeme) {
        return cachedMeme;
      }

      // 没有缓存，处理图片
      const extension = path.extname(memePath).toLowerCase();
      const mimeType = this.getMimeType(extension);

      let buffer: Buffer;
      const width = options?.width;
      const height = options?.height;

      // 如果是GIF，不进行处理，直接读取
      if (extension === '.gif') {
        buffer = await fs.readFile(memePath);
      } else {
        // 使用sharp处理其他格式的图片
        let sharpInstance = sharp(memePath);

        // 如果指定了尺寸，则调整大小
        if (width || height) {
          sharpInstance = sharpInstance.resize({
            width,
            height,
            fit: 'inside',
            withoutEnlargement: true,
          });
        }

        // 根据原格式输出，保持质量
        buffer = await sharpInstance.toBuffer();
      }

      const processedMeme: ProcessedMeme = {
        buffer,
        mimeType,
        filename: path.basename(memePath),
        size: buffer.length,
      };

      // 将处理后的图片存入缓存
      await this.cacheManager.set(cacheKey, processedMeme, this.CACHE_TTL);

      return processedMeme;
    } catch (error) {
      this.logger.error(`Error processing meme: ${(error as Error).message}`);
      return null;
    }
  }

  getMemeFilesCount(): number {
    return this.memeFiles.length;
  }

  getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }
}
