import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

const mockUploadsService = {
  initUpload: jest.fn().mockResolvedValue({
    uploadUrl: 'https://s3.example.com/upload',
    key: 'uploads/uuid.mt940',
  }),
};

describe('UploadsController', () => {
  let controller: UploadsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      controllers: [UploadsController],
      providers: [{ provide: UploadsService, useValue: mockUploadsService }],
    }).compile();

    controller = module.get<UploadsController>(UploadsController);
  });

  it('should return presigned URL on init', async () => {
    const result = await controller.init({
      filename: 'statement.mt940',
      contentType: 'application/octet-stream',
    });

    expect(result).toEqual({
      uploadUrl: 'https://s3.example.com/upload',
      key: 'uploads/uuid.mt940',
    });
    expect(mockUploadsService.initUpload).toHaveBeenCalledWith({
      filename: 'statement.mt940',
      contentType: 'application/octet-stream',
    });
  });
});
