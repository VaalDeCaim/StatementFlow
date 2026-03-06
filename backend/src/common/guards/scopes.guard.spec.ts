import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ScopesGuard } from './scopes.guard';

describe('ScopesGuard', () => {
  let guard: ScopesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new ScopesGuard(reflector);
  });

  const createContext = (user: {
    scope?: string | string[];
  }): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext;

  it('should allow when no scopes required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(createContext({ scope: [] }))).toBe(true);
  });

  it('should allow when user has required scope (string)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['jobs:read']);
    expect(
      guard.canActivate(createContext({ scope: 'jobs:read jobs:write' })),
    ).toBe(true);
  });

  it('should allow when user has required scope (array)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['jobs:read']);
    expect(
      guard.canActivate(createContext({ scope: ['jobs:read', 'jobs:write'] })),
    ).toBe(true);
  });

  it('should throw for missing scope', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['jobs:write']);
    expect(() =>
      guard.canActivate(createContext({ scope: 'jobs:read' })),
    ).toThrow('Required scope(s): jobs:write');
  });
});
