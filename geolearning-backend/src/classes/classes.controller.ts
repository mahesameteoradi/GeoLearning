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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClassesService } from './classes.service';
import {
  AddStudentDto,
  UpdateStudentDto,
  BulkRemoveStudentsDto,
  UnlockModuleDto,
} from './dto/classes.dto';

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
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan');
    }
    if (!teacherId) {
      throw new BadRequestException('teacherId wajib diisi');
    }
    return this.classesService.importBatchClasses(teacherId, file, req);
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
}
