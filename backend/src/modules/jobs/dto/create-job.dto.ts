import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateJobDto {
  @ApiProperty({ description: 'S3 key of the uploaded file' })
  @IsString()
  key: string;

  @ApiPropertyOptional({ description: 'Original filename' })
  @IsOptional()
  @IsString()
  originalFilename?: string;
}
