import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport'; // Or custom auth guard if they don't use passport
import { CurrentUser } from '../auth/auth.decorator';
import { Injectable, CanActivate } from '@nestjs/common';
import { Role } from '@prisma/client';

@Injectable()
export class AdminRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || user.user_metadata?.role !== 'ADMIN') {
      throw new UnauthorizedException('Akses ditolak: Hanya Super Admin yang diizinkan');
    }
    return true;
  }
}

@Controller('admin')
@UseGuards(AdminRoleGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('teachers')
  getTeachers() {
    return this.adminService.getTeachers();
  }

  @Post('teachers')
  createTeacher(@Body() body: any) {
    return this.adminService.createTeacher(body);
  }

  @Post('teachers/:id/verify')
  verifyTeacher(@Param('id') id: string) {
    return this.adminService.verifyTeacher(id);
  }

  @Post('teachers/:id/suspend')
  suspendTeacher(@Param('id') id: string) {
    return this.adminService.suspendTeacher(id);
  }

  @Put('teachers/:id')
  updateTeacher(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateTeacher(id, body);
  }

  @Delete('teachers/:id')
  deleteTeacher(@Param('id') id: string, @CurrentUser() user: any) {
    const adminId = user?.id || user?.sub;
    return this.adminService.deleteTeacher(id, adminId);
  }

  @Get('students')
  getStudents() {
    return this.adminService.getStudents();
  }

  @Get('classes')
  getClasses() {
    return this.adminService.getClasses();
  }

  @Get('quizzes')
  getQuizzes() {
    return this.adminService.getQuizzes();
  }
}
