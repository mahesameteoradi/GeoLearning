import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/auth.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('health')
  healthCheck(): object {
    return {
      status: 'ok',
      service: 'geolearning-backend',
      timestamp: new Date().toISOString(),
    };
  }



  @Public()
  @Get()
  getRoot(): string {
    return this.appService.getHello();
  }
}
