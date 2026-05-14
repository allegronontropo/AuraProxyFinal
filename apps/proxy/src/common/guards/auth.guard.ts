import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header.');
    }

    const rawKey = authHeader.slice(7).trim();
    if (!rawKey) {
      throw new UnauthorizedException('API key is empty.');
    }

    const { apiKey, project } = await this.authService.validateApiKey(rawKey);

    request.apiKey = apiKey;
    request.project = project;

    return true;
  }
}
