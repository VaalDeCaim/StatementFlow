import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from '../../entities/job.entity';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([Job]), StorageModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
