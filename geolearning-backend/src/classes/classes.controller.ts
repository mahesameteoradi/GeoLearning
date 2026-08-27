import {
  Controller,
  Post,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Body,
  Put,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClassesService } from './classes.service';
import {
  AddStudentDto,
  UpdateStudentDto,
  BulkRemoveStudentsDto,
  UnlockModuleDto,
} from './dto/classes.dto';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@Controller('kelas')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post(':classId/import-siswa')
  @UseInterceptors(FileInterceptor('file'))
  async importStudents(
    @Param('classId') classId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan');
    }
    return this.classesService.importStudents(classId, file, req);
  }

  @Post('import-batch')
  @UseInterceptors(FileInterceptor('file'))
  async importBatchClasses(
    @Body('teacherId') teacherId: string,
    @Body('gradeLevel') gradeLevel: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan');
    }
    if (!teacherId) {
      throw new BadRequestException('teacherId wajib diisi');
    }
    
    const parsedGradeLevel = gradeLevel ? parseInt(gradeLevel, 10) : undefined;
    
    return this.classesService.importBatchClasses(teacherId, file, req, parsedGradeLevel);
  }

  @Post(':classId/students')
  async addStudent(
    @Param('classId') classId: string,
    @Body() body: AddStudentDto,
  ) {
    return this.classesService.addStudent(classId, body);
  }

  @Put(':classId/students/:classStudentId')
  async updateStudent(
    @Param('classId') classId: string,
    @Param('classStudentId') classStudentId: string,
    @Body() body: UpdateStudentDto,
  ) {
    return this.classesService.updateStudent(classId, classStudentId, body);
  }

  @Delete(':classId')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth('supabase-jwt')
  @ApiOperation({ summary: 'Delete a class and all its associated students' })
  async deleteClass(@Param('classId') classId: string) {
    return this.classesService.deleteClass(classId);
  }

  @Delete(':classId/students/:classStudentId')
  async removeStudent(
    @Param('classId') classId: string,
    @Param('classStudentId') classStudentId: string,
  ) {
    return this.classesService.removeStudent(classId, classStudentId);
  }

  @Post(':classId/students/bulk-delete')
  async bulkRemoveStudents(
    @Param('classId') classId: string,
    @Body() body: BulkRemoveStudentsDto,
  ) {
    return this.classesService.bulkRemoveStudents(classId, body.studentIds);
  }

  @Post(':classId/students/:studentId/unlock-module')
  async unlockModule(
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
    @Body() body: UnlockModuleDto,
  ) {
    return this.classesService.unlockModule(
      classId,
      studentId,
      body.module_id,
      body.teacher_id,
      body.note,
    );
  }

  @Post(':classId/materials/:materialId/complete')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth('supabase-jwt')
  @ApiOperation({ summary: 'Mark material as completed and award XP' })
  async completeMaterial(
    @Param('classId') classId: string,
    @Param('materialId') materialId: string,
    @Body() body: { userId: string },
  ) {
    return this.classesService.completeMaterial(classId, materialId, body.userId);
  }
}
