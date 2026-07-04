import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const start = performance.now();
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header.');
    }

    const rawKey = authHeader.slice(7).trim();
    if (!rawKey) {
      throw new UnauthorizedException('API key is empty.');
    }

    const bypassSecret = process.env.INTERNAL_DASHBOARD_BYPASS_SECRET;
    let apiKey, project;

    if (bypassSecret && rawKey === bypassSecret) {
      const keyId = request.headers['x-dashboard-api-key-id'];
      if (!keyId) {
        throw new UnauthorizedException('Missing x-dashboard-api-key-id header for internal bypass.');
      }
      const result = await this.authService.validateApiKeyById(keyId as string);
      apiKey = result.apiKey;
      project = result.project;
    } else {
      const result = await this.authService.validateApiKey(rawKey);
      apiKey = result.apiKey;
      project = result.project;
    }

    request.apiKey = apiKey;
    request.project = project;
    request.authLatencyMs = Math.round(performance.now() - start);

    return true;
  }
}
