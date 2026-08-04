import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SupabaseService } from '../supabase/supabase.service';
import { IS_PUBLIC_KEY } from './auth.decorator';

/**
 * SupabaseAuthGuard
 *
 * Validates incoming requests by extracting the Bearer JWT from the
 * Authorization header and verifying it against Supabase Auth.
 *
 * No local password hashing is performed — authentication is fully
 * delegated to Supabase.
 *
 * Usage:
 *   - Applied globally in AppModule (recommended), OR
 *   - Applied per-controller/route with @UseGuards(SupabaseAuthGuard)
 *   - Use @Public() decorator to opt specific routes out of auth.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Allow routes decorated with @Public() to bypass auth
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException(
        'Missing Authorization header. Expected: Bearer <token>',
      );
    }

    const user = await this.supabase.verifyToken(token);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired Supabase JWT token.');
    }

    // Attach the validated Supabase user to the request object
    (request as any).user = user;

    return true;
  }

  /**
   * Extracts the Bearer token from the Authorization header.
   * Returns null if header is missing or malformed.
   */
  private extractBearerToken(request: Request): string | null {
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    return authHeader.slice(7).trim() || null;
  }
}
