import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, JobStatus } from '../../entities/job.entity';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ExportsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    private readonly storage: StorageService,
  ) {}

  async getDownloadUrl(
    userId: string,
    jobId: string,
    format: 'csv' | 'xlsx' | 'qbo',
    expiresIn = 300,
  ): Promise<{ url: string }> {
    const job = await this.jobRepo.findOne({ where: { id: jobId, userId } });
    if (!job) throw new NotFoundException('Job not found');

    if (job.status !== JobStatus.COMPLETED) {
      throw new NotFoundException('Export not ready');
    }

    const keyMap = {
      csv: job.exportKeyCsv,
      xlsx: job.exportKeyXlsx,
      qbo: job.exportKeyQbo,
    };

    const key = keyMap[format];
    if (!key) throw new NotFoundException('Export format not found');

    const url = await this.storage.getPresignedGetUrl(
      'exports',
      key,
      expiresIn,
    );

    return { url };
  }
}
