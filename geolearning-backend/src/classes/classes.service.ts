import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { GamificationService } from '../gamification/gamification.service';
import { Role } from '@prisma/client';
import * as xlsx from 'xlsx';
import { calculateLevel } from '../gamification/constants/level-thresholds';

@Injectable()
export class ClassesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
    private readonly gamificationService: GamificationService,
  ) {}

  async importStudents(classId: string, file: Express.Multer.File, req?: any) {
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
    
    const rawData: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    let headerRowIndex = -1;
    
    // Cari baris header (maksimal cek 20 baris pertama)
    for (let i = 0; i < Math.min(rawData.length, 20); i++) {
      const row = rawData[i];
      if (!row || !Array.isArray(row)) continue;
      
      const rowString = row.join(' ').toUpperCase();
      if ((rowString.includes('NIPD') || rowString.includes('NIS')) && (rowString.includes('NAMA') || rowString.includes('PESERTA'))) {
        headerRowIndex = i;
        break;
      }
    }

    // Jika tidak ketemu, asumsikan baris pertama (index 0) adalah header (fallback template standar)
    if (headerRowIndex === -1) {
      headerRowIndex = 0;
    }

    const headersArray = rawData[headerRowIndex] || [];
    const headersMap = headersArray.map(h => typeof h === 'string' ? h.toUpperCase().replace(/\s+/g, '') : null);

    const data: any[] = [];
    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
      const rowArr = rawData[i];
      if (!rowArr || rowArr.length === 0) continue;
      
      const rowObj: Record<string, any> = {};
      let hasData = false;
      
      for (let j = 0; j < headersMap.length; j++) {
        const headerKey = headersMap[j];
        if (headerKey) {
          rowObj[headerKey] = rowArr[j];
          if (rowArr[j] !== undefined && rowArr[j] !== null && rowArr[j] !== '') {
            hasData = true;
          }
        }
      }
      
      if (hasData) {
        data.push(rowObj);
      }
    }

    if (data.length === 0) {
      throw new BadRequestException('Tidak ada data siswa untuk diimpor');
    }

    const supabaseAdmin = this.supabaseService.getAdminClient();

    let successCount = 0;
    let failCount = 0;
    const errors: { baris: number; alasan: string }[] = [];

    // Starting row index for error reporting (1-indexed + header offset)
    let rowIndex = headerRowIndex + 2;

    // Pre-fetch all emails and NIS to prevent N+1 query problem
    const allEmails: string[] = [];
    const allNis: string[] = [];
    for (const row of data) {
      if (req?.aborted || req?.socket?.destroyed) {
        throw new Error('Request aborted by client');
      }
      const nis = row['NIPD'] || row['NIS'] || row['NISN'];
      const email = row['EMAIL'] || (nis ? `${nis}@siswa.com` : null);
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
      if (req?.aborted || req?.socket?.destroyed) {
        console.warn('Import aborted by client. Stopping loop.');
        throw new BadRequestException('Proses import dibatalkan oleh pengguna');
      }

      const no_absen = row['NO'] || row['NOABSEN'];
      const nama = row['NAMAPESERTA'] || row['NAMA'];
      const nis = row['NIPD'] || row['NIS'] || row['NISN'];
      
      // Auto-generate email and password if not provided
      const email = row['EMAIL'] || (nis ? `${nis}@siswa.com` : null);
      const sandi = row['SANDI'] || row['PASSWORD'] || '12345678';

      if (!nama || !nis) {
        errors.push({
          baris: rowIndex,
          alasan: `Data tidak lengkap. Terbaca: ${JSON.stringify(row)}`,
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

          const newUser = await this.prisma.user.upsert({
            where: { id: authData.user.id },
            update: {
              name: nama.toString(),
              email: email.toString(),
              role: Role.STUDENT,
              nis_nip: nis.toString(),
            },
            create: {
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

      user = await this.prisma.user.upsert({
        where: { id: authData.user.id },
        update: {
          name,
          email,
          role: Role.STUDENT,
          nis_nip,
        },
        create: {
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

  private async removeStudentClassProgress(classId: string, studentIds: string[]) {
    // 1. Dapatkan semua material, kuis, dan project di kelas ini
    const classData = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        modules: {
          include: {
            materials: true,
            quizzes: true,
          }
        },
        quizzes: true,
        projectAssignments: true,
      }
    });

    if (!classData) return;

    const materialIds: string[] = [];
    const quizIds: string[] = classData.quizzes.map(q => q.id);
    classData.modules.forEach(m => {
      materialIds.push(...m.materials.map(mat => mat.id));
      quizIds.push(...m.quizzes.map(q => q.id));
    });
    const projectIds: string[] = classData.projectAssignments.map(p => p.id);

    // Proses untuk setiap siswa
    for (const studentId of studentIds) {
      let xpToDeduct = 0;

      // a. Material Completions
      if (materialIds.length > 0) {
        const completions = await this.prisma.materialCompletion.findMany({
          where: { user_id: studentId, material_id: { in: materialIds } },
          include: { material: true }
        });
        completions.forEach(c => xpToDeduct += (c.material.xp_reward || 0));
        await this.prisma.materialCompletion.deleteMany({
          where: { user_id: studentId, material_id: { in: materialIds } }
        });
      }

      // b. Quiz Attempts
      if (quizIds.length > 0) {
        const attempts = await this.prisma.quizAttempt.findMany({
          where: { user_id: studentId, quiz_id: { in: quizIds } }
        });
        attempts.forEach(a => xpToDeduct += (a.xp_earned || 0));
        await this.prisma.quizAttempt.deleteMany({
          where: { user_id: studentId, quiz_id: { in: quizIds } }
        });
      }

      // c. Project Submissions
      if (projectIds.length > 0) {
        const submissions = await this.prisma.projectSubmission.findMany({
          where: { user_id: studentId, assignment_id: { in: projectIds } }
        });
        submissions.forEach(s => xpToDeduct += (s.xp_earned || 0));
        await this.prisma.projectSubmission.deleteMany({
          where: { user_id: studentId, assignment_id: { in: projectIds } }
        });
      }

      // Decrement User XP and Level
      if (xpToDeduct > 0) {
        const user = await this.prisma.user.findUnique({ where: { id: studentId } });
        if (user) {
          const newXp = Math.max(0, user.xp - xpToDeduct);
          const newLevel = calculateLevel(newXp);
          await this.prisma.user.update({
            where: { id: studentId },
            data: { xp: newXp, level: newLevel }
          });
          
          await this.prisma.xpLog.create({
            data: {
              user_id: studentId,
              amount: -xpToDeduct,
              source: 'KELAS_DIHAPUS',
              reference_id: classId
            }
          });
        }
      }
    }
  }

  async removeStudent(classId: string, classStudentId: string) {
    const classStudent = await this.prisma.classStudent.findUnique({
      where: { id: classStudentId, class_id: classId },
    });

    if (!classStudent)
      throw new BadRequestException('Data siswa tidak ditemukan');

    const enrollmentsCount = await this.prisma.classStudent.count({
      where: { student_id: classStudent.student_id },
    });

    if (enrollmentsCount <= 1) {
      // Hard delete user completely (Cascades to ClassStudent, QuizAttempt, MaterialCompletion, XpLog)
      const supabaseAdmin = this.supabaseService.getAdminClient();
      await supabaseAdmin.auth.admin.deleteUser(classStudent.student_id);
      await this.prisma.user.delete({ where: { id: classStudent.student_id } });
    } else {
      // Soft remove: Just remove from this class and deduct XP
      await this.removeStudentClassProgress(classId, [classStudent.student_id]);
      await this.prisma.classStudent.delete({
        where: { id: classStudentId },
      });
    }

    return { success: true };
  }

  async bulkRemoveStudents(classId: string, classStudentIds: string[]) {
    const classStudents = await this.prisma.classStudent.findMany({
      where: {
        class_id: classId,
        id: { in: classStudentIds },
      },
    });

    const studentIds = classStudents.map((cs) => cs.student_id);
    const studentsToDelete: string[] = [];
    const studentsToRemoveFromClass: string[] = [];

    for (const studentId of studentIds) {
      const enrollmentsCount = await this.prisma.classStudent.count({
        where: { student_id: studentId },
      });
      if (enrollmentsCount <= 1) {
        studentsToDelete.push(studentId);
      } else {
        studentsToRemoveFromClass.push(studentId);
      }
    }

    // Hard delete users completely
    if (studentsToDelete.length > 0) {
      const supabaseAdmin = this.supabaseService.getAdminClient();
      await Promise.all(
        studentsToDelete.map((id) => supabaseAdmin.auth.admin.deleteUser(id)),
      );
      await this.prisma.user.deleteMany({
        where: { id: { in: studentsToDelete } },
      });
    }

    // Soft remove from class
    if (studentsToRemoveFromClass.length > 0) {
      await this.removeStudentClassProgress(classId, studentsToRemoveFromClass);
      await this.prisma.classStudent.deleteMany({
        where: {
          class_id: classId,
          student_id: { in: studentsToRemoveFromClass },
        },
      });
    }
    
    return { success: true };
  }

  async deleteClass(classId: string) {
    // 1. Fetch all students in the class
    const classStudents = await this.prisma.classStudent.findMany({
      where: { class_id: classId },
    });

    const studentIds = classStudents.map((cs) => cs.student_id);
    const studentsToDelete: string[] = [];

    // 2. Identify students enrolled ONLY in this class
    for (const studentId of studentIds) {
      const enrollmentsCount = await this.prisma.classStudent.count({
        where: { student_id: studentId },
      });
      if (enrollmentsCount <= 1) {
        studentsToDelete.push(studentId);
      }
    }

    // 3. Hard delete these users completely (from Supabase Auth and Prisma)
    if (studentsToDelete.length > 0) {
      const supabaseAdmin = this.supabaseService.getAdminClient();
      await Promise.all(
        studentsToDelete.map((id) => supabaseAdmin.auth.admin.deleteUser(id).catch(err => console.error(err))),
      );
      await this.prisma.user.deleteMany({
        where: { id: { in: studentsToDelete } },
      });
    }

    // 4. Finally, delete the class itself
    await this.prisma.class.delete({
      where: { id: classId },
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

  async importBatchClasses(teacherId: string, file: Express.Multer.File, req?: any) {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan');
    }

    let workbook;
    try {
      workbook = xlsx.read(file.buffer, { type: 'buffer' });
    } catch (e) {
      throw new BadRequestException('Format file tidak didukung atau rusak');
    }

    const supabaseAdmin = this.supabaseService.getAdminClient();

    const results = {
      classesCreated: 0,
      classesReused: 0,
      studentsAdded: 0,
      studentsFailed: 0,
      errors: [] as { sheet: string; baris: number; alasan: string }[],
    };

    for (const sheetName of workbook.SheetNames) {
      if (req?.aborted || req?.socket?.destroyed) {
        throw new BadRequestException('Proses import dibatalkan oleh pengguna');
      }

      const upperName = sheetName.toUpperCase();
      if (upperName === 'TOTAL' || upperName === 'REKAP') {
        continue;
      }

      const sheet = workbook.Sheets[sheetName];
      const rawData: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      if (!rawData || rawData.length === 0) continue;

      let className = sheetName;
      let headerRowIndex = -1;

      // Scan for Class Name, and Header row
      for (let i = 0; i < Math.min(rawData.length, 30); i++) {
        const row = rawData[i];
        if (!row || !Array.isArray(row)) continue;

        const rowStr = row.join(' ').toUpperCase();

        // Find 'Kelas :'
        for (const cell of row) {
          if (typeof cell === 'string') {
            if (cell.toUpperCase().includes('KELAS')) {
              const parts = cell.split(':');
              if (parts.length > 1 && parts[1].trim() !== '') {
                className = parts[1].trim();
              } else {
                // Maybe the next cell has the value?
                const colIdx = row.indexOf(cell);
                if (row[colIdx + 1]) {
                  const nextCell = String(row[colIdx + 1]).trim();
                  if (nextCell.startsWith(':')) {
                    className = nextCell.substring(1).trim();
                  } else {
                    className = nextCell;
                  }
                }
              }
            }
          }
        }

        if ((rowStr.includes('NIPD') || rowStr.includes('NIS') || rowStr.includes('NISN')) && 
            (rowStr.includes('NAMA') || rowStr.includes('PESERTA'))) {
          headerRowIndex = i;
          break; // Stop finding header
        }
      }

      if (headerRowIndex === -1) {
        results.errors.push({ sheet: sheetName, baris: 0, alasan: 'Tidak dapat menemukan baris header (NIPD/NAMA)' });
        continue;
      }

      if (!className) className = sheetName;

      // Create or Get Class
      let cls = await this.prisma.class.findFirst({
        where: { name: className, teacher_id: teacherId }
      });

      if (!cls) {
        // Create new class
        const joinCode = Array.from({ length: 8 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
        cls = await this.prisma.class.create({
          data: {
            name: className,
            teacher_id: teacherId,
            join_code: joinCode,
          }
        });
        results.classesCreated++;
      } else {
        results.classesReused++;
      }

      const headersArray = rawData[headerRowIndex] || [];
      const headersMap = headersArray.map((h: any) => h !== undefined && h !== null ? String(h).toUpperCase().replace(/\s+/g, '') : null);

      let nisIndex = -1;
      let namaIndex = -1;
      for (let j = 0; j < headersMap.length; j++) {
        if (!headersMap[j]) continue;
        const h = headersMap[j] as string;
        if (h.includes('NIPD') || (h.includes('NIS') && !h.includes('JENIS')) || h.includes('NOINDUK') || h.includes('INDUK')) {
          if (nisIndex === -1) nisIndex = j;
        }
        if (h.includes('NAMA') || h === 'PESERTADIDIK' || h === 'SISWA') {
          // Avoid matching NAMA ORANG TUA or NAMA WALI
          if (!h.includes('ORANGTUA') && !h.includes('WALI') && !h.includes('AYAH') && !h.includes('IBU')) {
            if (namaIndex === -1) namaIndex = j;
          }
        }
      }

      if (nisIndex === -1 || namaIndex === -1) {
        results.errors.push({ sheet: sheetName, baris: headerRowIndex + 1, alasan: `Kolom ${nisIndex === -1 ? 'NIPD/NIS' : 'NAMA'} tidak ditemukan di tabel` });
        continue; // Skip this sheet entirely if we can't find the columns
      }

      // Get current students in this class
      const existingClassStudents = await this.prisma.classStudent.findMany({
        where: { class_id: cls.id },
        select: { student_id: true }
      });
      const studentsInClass = new Set(existingClassStudents.map(cs => cs.student_id));

      // Process Students
      let rowIndex = headerRowIndex + 1;
      let currentNoAbsen = 1;
      while (rowIndex < rawData.length) {
        if (req?.aborted || req?.socket?.destroyed) {
          throw new BadRequestException('Proses import dibatalkan oleh pengguna');
        }

        const rowArr = rawData[rowIndex];
        if (!rowArr || rowArr.length === 0 || rowArr.join('').trim() === '') {
          // Empty row
          rowIndex++;
          continue;
        }
        
        const rowObj: Record<string, any> = {};
        for (let j = 0; j < headersMap.length; j++) {
          if (headersMap[j]) rowObj[headersMap[j] as string] = rowArr[j];
        }

        // Check stop conditions
        const firstColStr = String(rowArr[0] || '').toUpperCase();
        if (firstColStr.includes('LAKI-LAKI') || firstColStr.includes('PEREMPUAN') || firstColStr.includes('JUMLAH')) {
          break;
        }

        const nisRaw = rowArr[nisIndex];
        if (!nisRaw || String(nisRaw).trim() === '') {
          // Just skip without error if it's an empty looking row
          const hasData = rowArr.some((v: any, idx: number) => idx !== nisIndex && v !== undefined && v !== null && v.toString().trim() !== '');
          if (!hasData) {
            rowIndex++;
            continue;
          }
          // If it has other data but NIS is empty, it might be a merged header sub-row or an invalid student
          // If the row looks like a sub-header (e.g. L / P columns), we can safely skip it
          const firstCellStr = String(rowArr[0] || '').trim();
          if (!firstCellStr && rowIndex === headerRowIndex + 1) {
             // likely the second row of a merged header
             rowIndex++;
             continue;
          }

          results.errors.push({ sheet: sheetName, baris: rowIndex + 1, alasan: 'NIPD kosong pada baris yang berisi data' });
          rowIndex++;
          continue;
        }
        
        const nis = String(nisRaw).trim();
        const namaRaw = rowArr[namaIndex];
        const nama = String(namaRaw || '').trim();
        
        if (!nama) {
          results.errors.push({ sheet: sheetName, baris: rowIndex + 1, alasan: 'Nama kosong' });
          rowIndex++;
          continue;
        }

        const email = `${nis}@siswa.com`;
        const password = '12345678';

        try {
          let user = await this.prisma.user.findUnique({ where: { email } });
          if (!user) {
             user = await this.prisma.user.findFirst({ where: { nis_nip: nis } });
          }

          if (!user) {
            // Create in Auth
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
              user_metadata: { role: 'STUDENT', full_name: nama, nis_nip: nis },
            });

            if (authError) throw new Error(authError.message);
            if (!authData.user) throw new Error('Gagal membuat user auth');

            try {
              user = await this.prisma.user.create({
                data: {
                  id: authData.user.id,
                  name: nama,
                  email: email,
                  role: Role.STUDENT,
                  nis_nip: nis,
                }
              });
            } catch (e: any) {
              if (e.code === 'P2002') {
                user = await this.prisma.user.update({
                  where: { id: authData.user.id },
                  data: {
                    name: nama,
                    email: email,
                    role: Role.STUDENT,
                    nis_nip: nis,
                  }
                });
              } else {
                throw e;
              }
            }
          } else {
            // Check if names match (to prevent NIPD collision between different students)
            const existingName = (user.name || '').toLowerCase().replace(/[^a-z]/g, '');
            const newName = nama.toLowerCase().replace(/[^a-z]/g, '');
            
            // If completely different names, reject to prevent overwriting
            if (existingName && newName && !existingName.includes(newName) && !newName.includes(existingName)) {
              results.errors.push({ 
                sheet: sheetName, 
                baris: rowIndex + 1, 
                alasan: `NIPD ${nis} bentrok dengan siswa bernama "${user.name}". Silakan bedakan NIPD-nya di Excel jika ini siswa yang berbeda.` 
              });
              results.studentsFailed++;
              rowIndex++;
              continue;
            }

            // Update in DB
            user = await this.prisma.user.update({
              where: { id: user.id },
              data: { name: nama, nis_nip: nis }
            });
          }

          // Add to class if not already in it
          if (!studentsInClass.has(user.id)) {
            await this.prisma.classStudent.create({
              data: {
                class_id: cls.id,
                student_id: user.id,
                no_absen: currentNoAbsen,
              },
            });
            studentsInClass.add(user.id);
          } else {
            await this.prisma.classStudent.updateMany({
              where: { class_id: cls.id, student_id: user.id },
              data: { no_absen: currentNoAbsen },
            });
          }
          
          currentNoAbsen++;
          results.studentsAdded++;
        } catch (err: any) {
          results.errors.push({ sheet: sheetName, baris: rowIndex + 1, alasan: err.message || 'Gagal menyimpan siswa' });
          results.studentsFailed++;
        }

        rowIndex++;
      }
    }

    return results;
  }

  async completeMaterial(classId: string, materialId: string, studentId: string) {
    // 1. Check if material exists
    const material = await this.prisma.material.findUnique({
      where: { id: materialId },
    });
    if (!material) throw new NotFoundException('Materi tidak ditemukan');

    // 2. Check if already completed (prevent farming XP)
    const existing = await this.prisma.materialCompletion.findUnique({
      where: {
        user_id_material_id: {
          user_id: studentId,
          material_id: materialId,
        },
      },
    });

    if (existing) {
      return { success: true, message: 'Already completed', xpEarned: 0, earnedBadges: [] };
    }

    // 3. Mark as completed
    await this.prisma.materialCompletion.create({
      data: {
        user_id: studentId,
        material_id: materialId,
      },
    });

    // 4. Award XP via gamification service (atomic transaction)
    let earnedBadges: any[] = [];
    const xpAmount = material.xp_reward ?? 0;
    
    if (xpAmount > 0) {
      const xpResult = await this.gamificationService.awardXP(studentId, xpAmount, {
        source: 'MATERIAL_READ',
        referenceId: materialId,
      });
      earnedBadges = xpResult.newBadges || [];
    }

    return {
      success: true,
      xpEarned: xpAmount,
      earnedBadges,
    };
  }
}
