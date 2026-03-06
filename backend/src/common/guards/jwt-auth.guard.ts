import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private config: ConfigService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    if (this.config.get<string>('AUTH_DISABLED') === 'true') {
      const request = context.switchToHttp().getRequest<{ user: object }>();
      request.user = {
        sub: 'dev-user',
        email: 'dev@local',
        name: 'Dev User',
        scope: 'jobs:read jobs:write exports:download',
      };
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(err: unknown, user: unknown): TUser {
    if (err || !user) {
      throw err instanceof Error
        ? err
        : new UnauthorizedException('Invalid or expired token');
    }
    return user as TUser;
  }
}
