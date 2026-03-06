import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ScopesGuard } from '../../common/guards/scopes.guard';
import { Scopes } from '../../common/decorators/scopes.decorator';
import { ExportsService } from './exports.service';

@Controller('exports')
@UseGuards(JwtAuthGuard, ScopesGuard)
@Scopes('exports:download')
@ApiBearerAuth()
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get(':jobId/:format')
  @ApiOperation({ summary: 'Get presigned download URL for export' })
  @ApiResponse({ status: 200, description: 'Presigned URL' })
  async getDownloadUrl(
    @Req() req: { user: { sub: string } },
    @Param('jobId') jobId: string,
    @Param('format') format: 'csv' | 'xlsx' | 'qbo',
    @Query('expiresIn') expiresIn?: string,
  ) {
    return this.exportsService.getDownloadUrl(
      req.user.sub,
      jobId,
      format,
      expiresIn ? parseInt(expiresIn, 10) : undefined,
    );
  }
}
