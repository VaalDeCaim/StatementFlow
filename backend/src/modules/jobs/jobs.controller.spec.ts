import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';

const mockJobsService = {
  create: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
};

describe('JobsController', () => {
  let controller: JobsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [JobsController],
      providers: [{ provide: JobsService, useValue: mockJobsService }],
    }).compile();

    controller = module.get<JobsController>(JobsController);
  });

  it('should create job', async () => {
    const dto: CreateJobDto = { key: 'uploads/abc.mt940' };
    const job = { id: 'job-1', rawKey: dto.key, status: 'pending' };
    mockJobsService.create.mockResolvedValue(job);

    const result = await controller.create(
      { user: { sub: 'user-1' } } as never,
      dto,
    );

    expect(result).toEqual(job);
    expect(mockJobsService.create).toHaveBeenCalledWith('user-1', dto);
  });

  it('should list jobs', async () => {
    const jobs = [{ id: 'job-1' }];
    mockJobsService.findAll.mockResolvedValue(jobs);

    const result = await controller.findAll({
      user: { sub: 'user-1' },
    } as never);

    expect(result).toEqual(jobs);
    expect(mockJobsService.findAll).toHaveBeenCalledWith('user-1');
  });
});
