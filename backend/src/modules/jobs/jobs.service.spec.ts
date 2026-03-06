import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JobsService } from './jobs.service';
import { Job, JobStatus } from '../../entities/job.entity';
import { StorageService } from '../storage/storage.service';
import { CreateJobDto } from './dto/create-job.dto';

const mockJobRepo = {
  create: jest.fn((dto: object) => ({ ...dto, id: 'job-123' })),
  save: jest.fn((job: object) => Promise.resolve({ ...job, id: 'job-123' })),
  findOne: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
};

const mockStorageService = {
  getClient: jest.fn(),
  getRawBucket: jest.fn().mockReturnValue('raw'),
  getExportsBucket: jest.fn().mockReturnValue('exports'),
};

describe('JobsService', () => {
  let service: JobsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockJobRepo.findOne.mockResolvedValue(null);
    mockJobRepo.find.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: getRepositoryToken(Job), useValue: mockJobRepo },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  describe('create', () => {
    it('should create and return a job', async () => {
      const dto: CreateJobDto = { key: 'uploads/abc.mt940' };
      const result = await service.create('user-1', dto);
      expect(result.id).toBe('job-123');
      expect(mockJobRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          rawKey: 'uploads/abc.mt940',
          status: JobStatus.PENDING,
        }),
      );
      expect(mockJobRepo.save).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return job when found', async () => {
      const job = {
        id: 'job-1',
        userId: 'user-1',
        status: JobStatus.COMPLETED,
      };
      mockJobRepo.findOne.mockResolvedValue(job);
      const result = await service.findOne('job-1', 'user-1');
      expect(result).toEqual(job);
    });

    it('should throw NotFoundException when job not found', async () => {
      mockJobRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('job-1', 'user-1')).rejects.toThrow(
        'Job not found',
      );
    });
  });

  describe('findAll', () => {
    it('should return user jobs', async () => {
      const jobs = [{ id: 'job-1', userId: 'user-1' }];
      mockJobRepo.find.mockResolvedValue(jobs);
      const result = await service.findAll('user-1');
      expect(result).toEqual(jobs);
      expect(mockJobRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
      });
    });
  });
});
