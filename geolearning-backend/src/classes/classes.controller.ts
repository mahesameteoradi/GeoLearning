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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClassesService } from './classes.service';

@Controller('kelas')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post(':classId/import-siswa')
  @UseInterceptors(FileInterceptor('file'))
  async importStudents(
    @Param('classId') classId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan');
    }
    return this.classesService.importStudents(classId, file);
  }

  @Post(':classId/students')
  async addStudent(
    @Param('classId') classId: string,
    @Body()
    body: {
      name: string;
      email: string;
      nis_nip?: string;
      no_absen?: number;
      password?: string;
    },
  ) {
    return this.classesService.addStudent(classId, body);
  }

  @Put(':classId/students/:classStudentId')
  async updateStudent(
    @Param('classId') classId: string,
    @Param('classStudentId') classStudentId: string,
    @Body()
    body: {
      no_absen?: number;
      nis_nip?: string;
      name?: string;
      email?: string;
      password?: string;
    },
  ) {
    return this.classesService.updateStudent(classId, classStudentId, body);
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
    @Body() body: { studentIds: string[] },
  ) {
    if (!body.studentIds || !Array.isArray(body.studentIds)) {
      throw new BadRequestException('studentIds must be an array');
    }
    return this.classesService.bulkRemoveStudents(classId, body.studentIds);
  }

  @Post(':classId/students/:studentId/unlock-module')
  async unlockModule(
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
    @Body() body: { module_id: string; note: string; teacher_id: string },
  ) {
    if (!body.module_id || !body.teacher_id) {
      throw new BadRequestException('module_id and teacher_id are required');
    }
    return this.classesService.unlockModule(
      classId,
      studentId,
      body.module_id,
      body.teacher_id,
      body.note,
    );
  }
}
