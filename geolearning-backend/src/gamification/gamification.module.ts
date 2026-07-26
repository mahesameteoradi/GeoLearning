import { Module } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { GamificationListenerService } from './gamification-listener.service';

@Module({
  controllers: [GamificationController],
  providers: [GamificationService, GamificationListenerService],
  // Export so other modules (e.g. future QuizAttemptModule) can inject GamificationService
  exports: [GamificationService],
})
export class GamificationModule {}
