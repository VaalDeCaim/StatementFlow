import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, JobStatus, JobFormat } from '../../entities/job.entity';
import { StorageService } from '../storage/storage.service';
import { CreateJobDto } from './dto/create-job.dto';
import { Camt053Parser } from '../../parsers/camt053.parser';
import { Mt940Parser } from '../../parsers/mt940.parser';
import { detectFormat } from '../../parsers/format-detector';
import { exportToCsv } from '../../exporters/csv.exporter';
import { exportToXlsx } from '../../exporters/xlsx.exporter';
import { exportToQbo } from '../../exporters/qbo.exporter';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class JobsService {
  private readonly camtParser = new Camt053Parser();
  private readonly mt940Parser = new Mt940Parser();

  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    private readonly storage: StorageService,
  ) {}

  async create(userId: string, dto: CreateJobDto): Promise<Job> {
    const job = this.jobRepo.create({
      userId,
      rawKey: dto.key,
      originalFilename: dto.originalFilename ?? null,
      status: JobStatus.PENDING,
    });
    await this.jobRepo.save(job);

    this.processJob(job.id).catch((err) => {
      console.error(`Job ${job.id} failed:`, err);
    });

    return job;
  }

  async findOne(id: string, userId: string): Promise<Job> {
    const job = await this.jobRepo.findOne({ where: { id, userId } });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async findAll(userId: string): Promise<Job[]> {
    return this.jobRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async processJob(jobId: string): Promise<void> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job || job.status !== JobStatus.PENDING) return;

    await this.jobRepo.update(jobId, { status: JobStatus.PROCESSING });

    try {
      const content = await this.fetchFileContent(job.rawKey);
      const format = detectFormat(content);

      await this.jobRepo.update(jobId, { format });

      const parseResult =
        format === JobFormat.CAMT053
          ? this.camtParser.parse(content)
          : this.mt940Parser.parse(content);

      if (
        parseResult.errors.length > 0 &&
        parseResult.transactions.length === 0
      ) {
        throw new Error(parseResult.errors.join('; '));
      }

      const { transactions } = parseResult;

      const baseKey = `exports/${jobId}`;

      const csvContent = exportToCsv(transactions);
      await this.uploadExport(baseKey + '.csv', csvContent, 'text/csv');

      const xlsxBuffer = await exportToXlsx(transactions);
      await this.uploadExport(
        baseKey + '.xlsx',
        xlsxBuffer,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );

      const qboContent = exportToQbo(transactions);
      await this.uploadExport(baseKey + '.qbo', qboContent, 'text/plain');

      await this.jobRepo.update(jobId, {
        status: JobStatus.COMPLETED,
        exportKeyCsv: baseKey + '.csv',
        exportKeyXlsx: baseKey + '.xlsx',
        exportKeyQbo: baseKey + '.qbo',
        errorMessage: null,
      });
    } catch (err) {
      await this.jobRepo.update(jobId, {
        status: JobStatus.FAILED,
        errorMessage: (err as Error).message,
      });
    }
  }

  private async fetchFileContent(key: string): Promise<string> {
    const client = this.storage.getClient();
    const bucket = this.storage.getRawBucket();
    const res = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    const body = res.Body;
    if (!body) throw new Error('Empty file');
    const buf = await body.transformToByteArray();
    return new TextDecoder().decode(buf);
  }

  private async uploadExport(
    key: string,
    content: string | Buffer,
    contentType: string,
  ): Promise<void> {
    const client = this.storage.getClient();
    const bucket = this.storage.getExportsBucket();
    const body =
      typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }
}
