import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MaterialType } from '@prisma/client';

@Injectable()
export class ResourcesService {
  constructor(private prisma: PrismaService) {}

  async findAll(teacherId: string) {
    return this.prisma.teacherResource.findMany({
      where: { teacher_id: teacherId },
      orderBy: { created_at: 'desc' },
    });
  }

  async create(teacherId: string, data: { title: string; description?: string; type: MaterialType; file_url?: string; content?: any }) {
    return this.prisma.teacherResource.create({
      data: {
        teacher_id: teacherId,
        title: data.title,
        description: data.description,
        type: data.type,
        file_url: data.file_url,
        content: data.content ? data.content : undefined,
      },
    });
  }

  async remove(teacherId: string, resourceId: string) {
    const resource = await this.prisma.teacherResource.findFirst({
      where: { id: resourceId, teacher_id: teacherId },
    });
    
    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    return this.prisma.teacherResource.delete({
      where: { id: resourceId },
    });
  }
}
