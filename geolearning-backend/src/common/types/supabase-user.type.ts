import { User } from '@supabase/supabase-js';

/**
 * Represents the Supabase-authenticated user attached to the request object.
 * This is derived from the validated JWT payload.
 */
export interface SupabaseUser extends User {
  // Supabase User already includes: id, email, role, user_metadata, app_metadata, etc.
  // Add any additional app-specific properties here if needed.
}

/**
 * Shape of the augmented Express Request after AuthGuard processes it.
 */
export interface AuthenticatedRequest extends Request {
  user: SupabaseUser;
}
