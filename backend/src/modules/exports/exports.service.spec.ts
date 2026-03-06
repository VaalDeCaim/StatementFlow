import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExportsService } from './exports.service';
import { Job, JobStatus } from '../../entities/job.entity';
import { StorageService } from '../storage/storage.service';

const mockJobRepo = {
  findOne: jest.fn(),
};

const mockStorageService = {
  getPresignedGetUrl: jest
    .fn()
    .mockResolvedValue('https://s3.example.com/download'),
};

describe('ExportsService', () => {
  let service: ExportsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportsService,
        { provide: getRepositoryToken(Job), useValue: mockJobRepo },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<ExportsService>(ExportsService);
  });

  it('should return download URL for completed job', async () => {
    mockJobRepo.findOne.mockResolvedValue({
      id: 'job-1',
      userId: 'user-1',
      status: JobStatus.COMPLETED,
      exportKeyCsv: 'exports/job-1.csv',
      exportKeyXlsx: 'exports/job-1.xlsx',
      exportKeyQbo: 'exports/job-1.qbo',
    });

    const result = await service.getDownloadUrl('user-1', 'job-1', 'csv');
    expect(result.url).toBe('https://s3.example.com/download');
    expect(mockStorageService.getPresignedGetUrl).toHaveBeenCalledWith(
      'exports',
      'exports/job-1.csv',
      300,
    );
  });

  it('should throw when job not found', async () => {
    mockJobRepo.findOne.mockResolvedValue(null);
    await expect(
      service.getDownloadUrl('user-1', 'job-1', 'csv'),
    ).rejects.toThrow('Job not found');
  });

  it('should throw when export not ready', async () => {
    mockJobRepo.findOne.mockResolvedValue({
      id: 'job-1',
      userId: 'user-1',
      status: JobStatus.PENDING,
    });

    await expect(
      service.getDownloadUrl('user-1', 'job-1', 'csv'),
    ).rejects.toThrow('Export not ready');
  });
});
