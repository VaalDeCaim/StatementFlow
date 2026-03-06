import { Injectable } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import { InitUploadDto } from './dto/init-upload.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadsService {
  constructor(private readonly storage: StorageService) {}

  async initUpload(
    dto: InitUploadDto,
  ): Promise<{ uploadUrl: string; key: string }> {
    const ext = dto.filename.includes('.')
      ? dto.filename.slice(dto.filename.lastIndexOf('.'))
      : '';
    const key = `uploads/${randomUUID()}${ext}`;

    const uploadUrl = await this.storage.getPresignedPutUrl(
      key,
      dto.contentType || 'application/octet-stream',
    );

    return { uploadUrl, key };
  }
}
