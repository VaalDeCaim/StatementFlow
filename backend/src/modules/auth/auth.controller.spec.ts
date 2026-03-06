import { AuthController } from './auth.controller';

describe('AuthController', () => {
  const controller = new AuthController();

  it('should return user info from request', () => {
    const req = {
      user: {
        sub: 'auth0|123',
        email: 'user@example.com',
        name: 'Test User',
      },
    };
    const result = controller.getMe(req);
    expect(result).toEqual({
      sub: 'auth0|123',
      email: 'user@example.com',
      name: 'Test User',
    });
  });
});
