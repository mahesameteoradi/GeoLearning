import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { LeaderboardService, LeaderboardEntry } from './leaderboard.service';
import { Public } from '../auth/auth.decorator';

@ApiTags('Leaderboard')
@ApiBearerAuth('supabase-jwt')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  /**
   * GET /v1/leaderboard
   *
   * Returns the current top-10 leaderboard snapshot.
   * This is the initial data load — after mounting, the frontend should
   * subscribe to the Supabase Realtime 'leaderboard' channel to receive
   * live updates without polling.
   *
   * Made @Public() so unauthenticated visitors can see the leaderboard.
   */
  @Public()
  @Get()
  @ApiOperation({
    summary: 'Get top-10 leaderboard (initial snapshot)',
    description:
      'Returns the current top-10 users by XP. For live updates, subscribe to the ' +
      'Supabase Realtime channel "leaderboard" and listen for "leaderboard_updated" events.',
  })
  @ApiResponse({ status: 200, description: 'Top-10 leaderboard entries with rank' })
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    return this.leaderboard.getTopTen();
  }
}
