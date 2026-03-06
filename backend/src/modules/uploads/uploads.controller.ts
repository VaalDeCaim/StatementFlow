import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ScopesGuard } from '../../common/guards/scopes.guard';
import { Scopes } from '../../common/decorators/scopes.decorator';
import { UploadsService } from './uploads.service';
import { InitUploadDto } from './dto/init-upload.dto';

@Controller('uploads')
@UseGuards(JwtAuthGuard, ScopesGuard)
@Scopes('jobs:write')
@ApiBearerAuth()
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('init')
  @ApiOperation({ summary: 'Get presigned URL for direct upload' })
  @ApiResponse({ status: 201, description: 'Presigned URL and key' })
  async init(@Body() dto: InitUploadDto) {
    return this.uploadsService.initUpload(dto);
  }
}
