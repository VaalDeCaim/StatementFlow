import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const authDisabled = config.get<string>('AUTH_DISABLED') === 'true';
    const issuerBaseUrl = config.get<string>('AUTH0_ISSUER_BASE_URL');
    const audience = config.get<string>('AUTH0_AUDIENCE');

    if (authDisabled) {
      super({
        jwtFromRequest: () => null,
        secretOrKey: 'dev-bypass',
        passReqToCallback: false,
      } as never);
      return;
    }

    if (!issuerBaseUrl || !audience) {
      throw new Error('AUTH0_ISSUER_BASE_URL and AUTH0_AUDIENCE are required');
    }

    const issuer = issuerBaseUrl.endsWith('/')
      ? `${issuerBaseUrl}`
      : `${issuerBaseUrl}/`;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience,
      issuer,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${issuerBaseUrl.replace(/\/$/, '')}.well-known/jwks.json`,
      }),
    });
  }

  validate(payload: Record<string, unknown>) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }
    return {
      sub: payload.sub,
      email: payload.email ?? payload[`${payload.aud as string}/email`],
      name: payload.name ?? payload[`${payload.aud as string}/name`],
      scope: payload.scope ?? payload[`${payload.aud as string}/scope`],
    };
  }
}
