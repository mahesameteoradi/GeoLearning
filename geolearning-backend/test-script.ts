import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { AnalyticsService } from './src/analytics/analytics.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const analyticsService = app.get(AnalyticsService);
  try {
    const res = await analyticsService.getClassStudents('GEO_XI_A');
    console.log(JSON.stringify(res, null, 2));
  } catch(e) {
    console.error("ERROR:", e);
  }
  await app.close();
}
bootstrap();
