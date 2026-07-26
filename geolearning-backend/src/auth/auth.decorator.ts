import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Request } from 'express';
import { SupabaseUser } from '../common/types/supabase-user.type';

/**
 * Metadata key used by SupabaseAuthGuard to identify public routes.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public()
 *
 * Marks a route or controller as publicly accessible,
 * bypassing the SupabaseAuthGuard JWT validation.
 *
 * @example
 * @Public()
 * @Get('health')
 * health() { return { status: 'ok' }; }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * @CurrentUser()
 *
 * Parameter decorator that extracts the authenticated Supabase user
 * from the request object (populated by SupabaseAuthGuard).
 *
 * @example
 * @Get('profile')
 * getProfile(@CurrentUser() user: SupabaseUser) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SupabaseUser => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (request as any).user as SupabaseUser;
  },
);
