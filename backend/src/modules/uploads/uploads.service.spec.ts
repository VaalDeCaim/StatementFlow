import { Test, TestingModule } from '@nestjs/testing';
import { UploadsService } from './uploads.service';
import { StorageService } from '../storage/storage.service';
import { InitUploadDto } from './dto/init-upload.dto';

const mockStorageService = {
  getPresignedPutUrl: jest
    .fn()
    .mockResolvedValue('https://s3.example.com/upload'),
};

describe('UploadsService', () => {
  let service: UploadsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
  });

  it('should return uploadUrl and key', async () => {
    const dto: InitUploadDto = {
      filename: 'statement.mt940',
      contentType: 'application/octet-stream',
    };
    const result = await service.initUpload(dto);
    expect(result.uploadUrl).toBe('https://s3.example.com/upload');
    expect(result.key).toMatch(/^uploads\/[a-f0-9-]+\.mt940$/);
  });

  it('should use default contentType when not provided', async () => {
    const dto: InitUploadDto = { filename: 'file.xml' };
    await service.initUpload(dto);
    expect(mockStorageService.getPresignedPutUrl).toHaveBeenCalledWith(
      expect.any(String),
      'application/octet-stream',
    );
  });
});
