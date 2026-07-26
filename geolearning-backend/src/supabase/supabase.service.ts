import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient;
  private readonly adminClient: SupabaseClient;

  constructor(private readonly config: ConfigService) {
    const supabaseUrl = this.config.getOrThrow<string>('SUPABASE_URL');
    const supabaseAnonKey = this.config.getOrThrow<string>('SUPABASE_ANON_KEY');
    const supabaseServiceKey = this.config.getOrThrow<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    // Public client — uses anon key (for auth operations)
    this.client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Admin client — uses service role key (bypasses RLS, server-side only)
    this.adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Returns the public Supabase client.
   */
  getClient(): SupabaseClient {
    return this.client;
  }

  /**
   * Returns the admin Supabase client (service role — never expose to client).
   */
  getAdminClient(): SupabaseClient {
    return this.adminClient;
  }

  /**
   * Validates a Supabase JWT and returns the authenticated user.
   * @param token — Bearer JWT from the Authorization header
   * @returns The Supabase User object, or null if invalid/expired
   */
  async verifyToken(token: string): Promise<User | null> {
    const { data, error } = await this.client.auth.getUser(token);

    if (error || !data.user) {
      return null;
    }

    return data.user;
  }
}
