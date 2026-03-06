import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ScopesGuard } from '../../common/guards/scopes.guard';
import { Scopes } from '../../common/decorators/scopes.decorator';

@Controller('me')
@UseGuards(JwtAuthGuard, ScopesGuard)
@Scopes('jobs:read')
@ApiBearerAuth()
export class AuthController {
  @Get()
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ status: 200, description: 'User info from JWT' })
  getMe(@Req() req: { user: { sub: string; email?: string; name?: string } }): {
    sub: string;
    email?: string;
    name?: string;
  } {
    return {
      sub: req.user.sub,
      email: req.user.email,
      name: req.user.name,
    };
  }
}
