import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from '../../entities/job.entity';
import { ExportsController } from './exports.controller';
import { ExportsService } from './exports.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([Job]), StorageModule],
  controllers: [ExportsController],
  providers: [ExportsService],
})
export class ExportsModule {}
