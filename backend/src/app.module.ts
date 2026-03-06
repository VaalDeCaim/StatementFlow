import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AuthModule } from './modules/auth/auth.module';
import { StorageModule } from './modules/storage/storage.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ExportsModule } from './modules/exports/exports.module';
import { Job } from './entities/job.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Job],
      synchronize: false,
      migrations: ['dist/database/migrations/*.js'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuthModule,
    StorageModule,
    UploadsModule,
    JobsModule,
    ExportsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
