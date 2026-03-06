import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucketRaw: string;
  private readonly bucketExports: string;
  private readonly presignExpiry = 900; // 15 min

  constructor(private config: ConfigService) {
    const endpoint = this.config.get<string>('S3_ENDPOINT');
    const region = this.config.get<string>('S3_REGION', 'us-east-1');
    const forcePathStyle =
      this.config.get<string>('S3_FORCE_PATH_STYLE') === 'true';

    this.client = new S3Client({
      endpoint: endpoint || undefined,
      region,
      forcePathStyle: !!endpoint && forcePathStyle,
      credentials: {
        accessKeyId: this.config.get<string>('S3_ACCESS_KEY_ID', ''),
        secretAccessKey: this.config.get<string>('S3_SECRET_ACCESS_KEY', ''),
      },
    });

    this.bucketRaw = this.config.get<string>('S3_BUCKET_RAW', 'raw');
    this.bucketExports = this.config.get<string>(
      'S3_BUCKET_EXPORTS',
      'exports',
    );
  }

  async ensureBuckets(): Promise<void> {
    for (const bucket of [this.bucketRaw, this.bucketExports]) {
      try {
        await this.client.send(new HeadBucketCommand({ Bucket: bucket }));
      } catch {
        await this.client.send(new CreateBucketCommand({ Bucket: bucket }));
      }
    }
  }

  async getPresignedPutUrl(key: string, contentType?: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketRaw,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, {
      expiresIn: this.presignExpiry,
    });
  }

  async getPresignedGetUrl(
    bucket: 'raw' | 'exports',
    key: string,
    expiresIn = 300,
  ): Promise<string> {
    const bucketName = bucket === 'raw' ? this.bucketRaw : this.bucketExports;
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  getRawBucket(): string {
    return this.bucketRaw;
  }

  getExportsBucket(): string {
    return this.bucketExports;
  }

  getClient(): S3Client {
    return this.client;
  }
}
