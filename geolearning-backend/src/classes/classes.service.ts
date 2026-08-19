import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { Role } from '@prisma/client';
import * as xlsx from 'xlsx';

@Injectable()
export class ClassesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async importStudents(classId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan');
    }

    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
    });
    if (!cls) {
      throw new BadRequestException('Kelas tidak ditemukan');
    }

    let workbook;
    try {
      workbook = xlsx.read(file.buffer, { type: 'buffer' });
    } catch (e) {
      throw new BadRequestException('Format file tidak didukung atau rusak');
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data: any[] = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      throw new BadRequestException('Tidak ada data untuk diimpor');
    }

    const supabaseAdmin = this.supabaseService.getAdminClient();

    let successCount = 0;
    let failCount = 0;
    const errors: { baris: number; alasan: string }[] = [];

    let rowIndex = 2; // Starting from row 2 (assuming header is row 1)

    // Pre-fetch all emails and NIS to prevent N+1 query problem
    const allEmails: string[] = [];
    const allNis: string[] = [];
    for (const row of data) {
      const email = row['Email'] || row['email'];
      const nis = row['NIS'] || row['nis'];
      if (email) allEmails.push(email.toString());
      if (nis) allNis.push(nis.toString());
    }

    const existingUsers = await this.prisma.user.findMany({
      where: {
        OR: [{ email: { in: allEmails } }, { nis_nip: { in: allNis } }],
      },
      select: { id: true, email: true, nis_nip: true },
    });

    const existingUsersByEmail = new Map(
      existingUsers.map((u) => [u.email, u]),
    );
    const existingUsersByNis = new Map(
      existingUsers.map((u) => [u.nis_nip, u]),
    );

    // Pre-fetch students already in this class
    const existingClassStudents = await this.prisma.classStudent.findMany({
      where: { class_id: classId },
      select: { student_id: true },
    });
    const studentsInClass = new Set(
      existingClassStudents.map((cs) => cs.student_id),
    );

    for (const row of data) {
      const no_absen = row['No Absen'] || row['no_absen'];
      const nama = row['Nama'] || row['nama'];
      const nis = row['NIS'] || row['nis'];
      const email = row['Email'] || row['email'];
      const sandi =
        row['Sandi'] || row['sandi'] || row['Password'] || row['password'];

      if (!nama || !nis || !email || !sandi) {
        errors.push({
          baris: rowIndex,
          alasan: 'Data tidak lengkap (Nama/NIS/Email/Sandi kosong)',
        });
        failCount++;
        rowIndex++;
        continue;
      }

      if (sandi.toString().length < 6) {
        errors.push({ baris: rowIndex, alasan: 'Sandi minimal 6 karakter' });
        failCount++;
        rowIndex++;
        continue;
      }

      // Check if NIS or Email already exists in DB
      let user =
        existingUsersByEmail.get(email.toString()) ||
        existingUsersByNis.get(nis.toString());

      try {
        if (!user) {
          // Create user in Supabase Auth
          const { data: authData, error: authError } =
            await supabaseAdmin.auth.admin.createUser({
              email: email.toString(),
              password: sandi.toString(),
              email_confirm: true,
              user_metadata: {
                role: 'STUDENT',
                full_name: nama.toString(),
                nis_nip: nis.toString(),
              },
            });

          if (authError) {
            throw new Error(authError.message);
          }

          if (!authData.user) {
            throw new Error('Gagal membuat user auth');
          }

          const newUser = await this.prisma.user.create({
            data: {
              id: authData.user.id,
              name: nama.toString(),
              email: email.toString(),
              role: Role.STUDENT,
              nis_nip: nis.toString(),
            },
          });
          user = {
            id: newUser.id,
            email: newUser.email,
            nis_nip: newUser.nis_nip,
          };
        } else {
          // Update existing user to match Excel data
          const { error: authError } =
            await supabaseAdmin.auth.admin.updateUserById(user.id, {
              email: email.toString(),
              password: sandi.toString(),
              user_metadata: {
                full_name: nama.toString(),
                nis_nip: nis.toString(),
              },
            });

          if (authError) {
            throw new Error(authError.message);
          }

          const updatedUser = await this.prisma.user.update({
            where: { id: user.id },
            data: {
              nis_nip: nis.toString(),
              name: nama.toString(),
              email: email.toString(),
            },
          });

          user.nis_nip = updatedUser.nis_nip;
          user.email = updatedUser.email;

          // Update memory maps
          existingUsersByEmail.set(email.toString(), user);
          existingUsersByNis.set(nis.toString(), user);
        }

        const parsedNoAbsen =
          no_absen !== undefined && no_absen !== null && no_absen.toString().trim() !== ''
            ? parseInt(no_absen.toString().trim(), 10)
            : null;
        const validNoAbsen = Number.isNaN(parsedNoAbsen) ? null : parsedNoAbsen;

        // Add to class if not already in it
        if (!studentsInClass.has(user.id)) {
          await this.prisma.classStudent.create({
            data: {
              class_id: classId,
              student_id: user.id,
              no_absen: validNoAbsen,
            },
          });
          studentsInClass.add(user.id);
        } else if (validNoAbsen !== null) {
          await this.prisma.classStudent.update({
            where: {
              class_id_student_id: { class_id: classId, student_id: user.id },
            },
            data: {
              no_absen: validNoAbsen,
            },
          });
        }

        successCount++;
      } catch (err: any) {
        errors.push({
          baris: rowIndex,
          alasan: err.message || 'Gagal menyimpan data',
        });
        failCount++;
      }

      rowIndex++;
    }

    return {
      status: 'success',
      total_baris: data.length,
      berhasil: successCount,
      gagal: failCount,
      detail_gagal: errors,
    };
  }

  async addStudent(
    classId: string,
    body: {
      name: string;
      email: string;
      nis_nip?: string;
      no_absen?: number;
      password?: string;
    },
  ) {
    const { name, email, nis_nip, no_absen, password } = body;
    if (!name || !email)
      throw new BadRequestException('Nama dan email wajib diisi');

    const supabaseAdmin = this.supabaseService.getAdminClient();

    // Check if user exists
    let user = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { nis_nip: nis_nip || undefined }] },
    });

    if (!user) {
      if (!password || password.length < 6) {
        throw new BadRequestException('Sandi minimal 6 karakter');
      }

      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            role: 'STUDENT',
            full_name: name,
            nis_nip: nis_nip,
          },
        });

      if (authError || !authData.user) {
        throw new BadRequestException(
          authError?.message || 'Gagal membuat user',
        );
      }

      user = await this.prisma.user.create({
        data: {
          id: authData.user.id,
          name,
          email,
          role: Role.STUDENT,
          nis_nip,
        },
      });
    } else {
      // Update nis_nip if missing
      if (nis_nip && user.nis_nip !== nis_nip) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { nis_nip },
        });
      }
    }

    // Add to class
    const existing = await this.prisma.classStudent.findUnique({
      where: {
        class_id_student_id: { class_id: classId, student_id: user.id },
      },
    });

    if (existing) {
      throw new BadRequestException('Siswa sudah ada di kelas ini');
    }

    const classStudent = await this.prisma.classStudent.create({
      data: {
        class_id: classId,
        student_id: user.id,
        no_absen: no_absen ? Number(no_absen) : null,
      },
      include: { student: true },
    });

    return classStudent;
  }

  async updateStudent(
    classId: string,
    classStudentId: string,
    body: {
      no_absen?: number;
      nis_nip?: string;
      name?: string;
      email?: string;
      password?: string;
    },
  ) {
    const classStudent = await this.prisma.classStudent.findUnique({
      where: { id: classStudentId, class_id: classId },
      include: { student: true },
    });

    if (!classStudent)
      throw new BadRequestException('Data siswa tidak ditemukan');

    const updateData: any = {};
    if (
      body.nis_nip !== undefined &&
      body.nis_nip !== classStudent.student.nis_nip
    ) {
      updateData.nis_nip = body.nis_nip || null;
    }
    if (body.name !== undefined && body.name !== classStudent.student.name) {
      updateData.name = body.name;
    }
    if (body.email !== undefined && body.email !== classStudent.student.email) {
      updateData.email = body.email;
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.user.update({
        where: { id: classStudent.student_id },
        data: updateData,
      });

      const supabaseAdmin = this.supabaseService.getAdminClient();
      const authUpdate: any = {};
      if (updateData.email) authUpdate.email = updateData.email;
      if (body.password) authUpdate.password = body.password;
      if (updateData.name || updateData.nis_nip !== undefined) {
        authUpdate.user_metadata = {
          full_name: updateData.name || classStudent.student.name,
          nis_nip:
            updateData.nis_nip !== undefined
              ? updateData.nis_nip
              : classStudent.student.nis_nip,
        };
      }

      if (Object.keys(authUpdate).length > 0) {
        await supabaseAdmin.auth.admin.updateUserById(
          classStudent.student_id,
          authUpdate,
        );
      }
    }

    if (body.no_absen !== undefined) {
      await this.prisma.classStudent.update({
        where: { id: classStudentId },
        data: { no_absen: body.no_absen ? Number(body.no_absen) : null },
      });
    }

    return { success: true };
  }

  async removeStudent(classId: string, classStudentId: string) {
    const classStudent = await this.prisma.classStudent.findUnique({
      where: { id: classStudentId, class_id: classId },
    });

    if (!classStudent)
      throw new BadRequestException('Data siswa tidak ditemukan');

    await this.prisma.classStudent.delete({
      where: { id: classStudentId },
    });

    return { success: true };
  }

  async bulkRemoveStudents(classId: string, classStudentIds: string[]) {
    await this.prisma.classStudent.deleteMany({
      where: {
        class_id: classId,
        id: { in: classStudentIds },
      },
    });
    return { success: true };
  }

  async unlockModule(
    classId: string,
    studentId: string,
    moduleId: string,
    teacherId: string,
    note?: string,
  ) {
    // Check if the student is in the class
    const classStudent = await this.prisma.classStudent.findFirst({
      where: { class_id: classId, student_id: studentId },
    });
    if (!classStudent)
      throw new BadRequestException('Siswa tidak ditemukan di kelas ini');

    // Check if the module is in the class
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
    });
    if (!module || module.class_id !== classId)
      throw new BadRequestException('Modul tidak valid');

    // Upsert ModuleUnlock
    const existing = await this.prisma.moduleUnlock.findFirst({
      where: { user_id: studentId, module_id: moduleId },
    });

    if (existing) {
      await this.prisma.moduleUnlock.update({
        where: { id: existing.id },
        data: { note, teacher_id: teacherId },
      });
    } else {
      await this.prisma.moduleUnlock.create({
        data: {
          user_id: studentId,
          module_id: moduleId,
          teacher_id: teacherId,
          note,
        },
      });
    }

    return { success: true };
  }
}
