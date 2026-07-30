// @ts-ignore
import { Module } from '@nestjs/common';
// @ts-ignore
import { AnalyticsService } from './analytics.service';
// @ts-ignore
import { AnalyticsController } from './analytics.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

