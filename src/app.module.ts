import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MemesModule } from './memes/memes.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public',
      serveStaticOptions: {
        index: false,
        maxAge: '1d',
      },
    }),
    MemesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
