import { Controller, Get, Post, Delete, Body, Param, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { SupabaseAuthGuard } from '../../auth/auth.guard';
import { MaterialType } from '@prisma/client';

@Controller('teacher/resources')
@UseGuards(SupabaseAuthGuard)
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  private checkTeacher(req: any) {
    if (req.user?.user_metadata?.role !== 'TEACHER') {
      throw new UnauthorizedException('Only teachers can access resources');
    }
    return req.user.id;
  }

  @Get()
  async findAll(@Req() req) {
    const userId = this.checkTeacher(req);
    return this.resourcesService.findAll(userId);
  }

  @Post()
  async create(@Req() req, @Body() data: { title: string; description?: string; type: MaterialType; file_url?: string; content?: any }) {
    const userId = this.checkTeacher(req);
    return this.resourcesService.create(userId, data);
  }

  @Delete(':id')
  async remove(@Req() req, @Param('id') id: string) {
    const userId = this.checkTeacher(req);
    return this.resourcesService.remove(userId, id);
  }
}
