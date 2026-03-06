import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ScopesGuard } from '../../common/guards/scopes.guard';
import { Scopes } from '../../common/decorators/scopes.decorator';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';

@Controller('jobs')
@UseGuards(JwtAuthGuard, ScopesGuard)
@ApiBearerAuth()
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @Scopes('jobs:write')
  @ApiOperation({ summary: 'Create a conversion job' })
  @ApiResponse({ status: 201, description: 'Job created' })
  async create(
    @Req() req: { user: { sub: string } },
    @Body() dto: CreateJobDto,
  ) {
    return this.jobsService.create(req.user.sub, dto);
  }

  @Get()
  @Scopes('jobs:read')
  @ApiOperation({ summary: 'List user jobs' })
  async findAll(@Req() req: { user: { sub: string } }) {
    return this.jobsService.findAll(req.user.sub);
  }

  @Get(':id')
  @Scopes('jobs:read')
  @ApiOperation({ summary: 'Get job by ID' })
  async findOne(
    @Req() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.jobsService.findOne(id, req.user.sub);
  }
}
