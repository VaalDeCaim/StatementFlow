import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SCOPES_KEY } from '../decorators/scopes.decorator';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(
      SCOPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredScopes?.length) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<{ user?: { scope?: string | string[] } }>();
    const userScopes: string[] = Array.isArray(user?.scope)
      ? user.scope
      : user?.scope
        ? String(user.scope).split(' ').filter(Boolean)
        : [];

    const hasScope = requiredScopes.some((scope) => userScopes.includes(scope));

    if (!hasScope) {
      throw new ForbiddenException(
        `Required scope(s): ${requiredScopes.join(', ')}`,
      );
    }

    return true;
  }
}
