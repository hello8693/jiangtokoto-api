import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as path from 'path';
import * as fs from 'fs-extra';
import { AppModule } from '../src/app.module';

describe('MemesController (e2e)', () => {
  let app: INestApplication;
  let imageCount: number;

  // 测试前，确保有图片文件
  beforeAll(async () => {
    // 使用与应用相同的图片目录配置
    const imagesDir = path.join(process.cwd(), process.env.IMAGES_DIRECTORY || 'public/images/images');
    
    // 确保目录存在
    await fs.ensureDir(imagesDir);
    
    // 获取图片文件数量
    const files = await fs.readdir(imagesDir);
    imageCount = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    }).length;
    
    // 如果没有图片，创建一个测试图片
    if (imageCount === 0) {
      // 复制README.md文件作为测试图片（这只是一个临时解决方案，实际测试应该有真实图片）
      await fs.copyFile(
        path.join(process.cwd(), 'README.md'), 
        path.join(imagesDir, 'test-image.png')
      );
      imageCount = 1;
    }
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/memes/count (GET)', () => {
    return request(app.getHttpServer())
      .get('/memes/count')
      .expect(200)
      .expect(res => {
        expect(res.body).toHaveProperty('count');
        expect(typeof res.body.count).toBe('number');
        // 至少有我们确认的图片数量
        expect(res.body.count).toBeGreaterThanOrEqual(imageCount);
      });
  });

  it('/memes/random (GET)', () => {
    return request(app.getHttpServer())
      .get('/memes/random')
      .expect(200)
      .expect('Content-Type', /image\/.*/)
      .expect(res => {
        // 响应应该是二进制图片数据
        expect(res.body).toBeInstanceOf(Buffer);
        expect(res.body.length).toBeGreaterThan(0);
      });
  });

  it('/memes/random with width and height (GET)', () => {
    return request(app.getHttpServer())
      .get('/memes/random?width=100&height=100')
      .expect(200)
      .expect('Content-Type', /image\/.*/)
      .expect(res => {
        // 响应应该是二进制图片数据
        expect(res.body).toBeInstanceOf(Buffer);
        expect(res.body.length).toBeGreaterThan(0);
      });
  });

  it('should handle errors when no memes available', async () => {
    // 模拟 getRandomMeme 返回 null 的情况
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('MemesService')
      .useValue({
        getRandomMeme: () => null,
        getMemeFilesCount: () => 0,
      })
      .compile();

    const testApp = moduleRef.createNestApplication();
    await testApp.init();

    await request(testApp.getHttpServer())
      .get('/memes/random')
      .expect(404)
      .expect(res => {
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toContain('没有找到表情包');
      });

    await testApp.close();
  });
});
