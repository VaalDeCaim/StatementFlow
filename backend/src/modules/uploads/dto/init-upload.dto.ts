import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InitUploadDto {
  @ApiProperty({ example: 'statement.mt940' })
  @IsString()
  filename: string;

  @ApiPropertyOptional({ example: 'application/octet-stream' })
  @IsOptional()
  @IsString()
  contentType?: string;
}
