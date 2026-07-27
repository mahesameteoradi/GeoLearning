import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, VerificationStatus } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async createTeacher(data: any) {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing Supabase Config');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        role: 'TEACHER',
        full_name: data.name,
        nis_nip: data.nis_nip
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
         throw new BadRequestException('Email sudah terdaftar');
      }
      throw new BadRequestException(authError.message);
    }

    if (!authData.user) throw new BadRequestException('Gagal membuat user auth');

    return this.prisma.user.upsert({
      where: { id: authData.user.id },
      update: {
        role: Role.TEACHER,
        verification_status: VerificationStatus.VERIFIED,
        name: data.name,
        nis_nip: data.nis_nip
      },
      create: {
        id: authData.user.id,
        name: data.name,
        email: data.email,
        role: Role.TEACHER,
        nis_nip: data.nis_nip,
        verification_status: VerificationStatus.VERIFIED, // Force verified when admin creates
      }
    });
  }

  async getTeachers() {
    return this.prisma.user.findMany({
      where: { role: Role.TEACHER },
      select: {
        id: true,
        name: true,
        email: true,
        nis_nip: true,
        verification_status: true,
        created_at: true,
      }
    });
  }

  async verifyTeacher(teacherId: string) {
    const teacher = await this.prisma.user.findUnique({ where: { id: teacherId } });
    if (!teacher || teacher.role !== Role.TEACHER) {
      throw new NotFoundException('Guru tidak ditemukan');
    }
    
    return this.prisma.user.update({
      where: { id: teacherId },
      data: { verification_status: VerificationStatus.VERIFIED },
    });
  }

  async suspendTeacher(teacherId: string) {
    const teacher = await this.prisma.user.findUnique({ where: { id: teacherId } });
    if (!teacher || teacher.role !== Role.TEACHER) {
      throw new NotFoundException('Guru tidak ditemukan');
    }

    return this.prisma.user.update({
      where: { id: teacherId },
      data: { verification_status: VerificationStatus.SUSPENDED },
    });
  }

  async updateTeacher(teacherId: string, data: any) {
    const teacher = await this.prisma.user.findUnique({ where: { id: teacherId } });
    if (!teacher || teacher.role !== Role.TEACHER) {
      throw new NotFoundException('Guru tidak ditemukan');
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) throw new Error('Missing Supabase Config');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update in Supabase Auth
    const authUpdates: any = {};
    if (data.email) authUpdates.email = data.email;
    if (data.password) authUpdates.password = data.password;
    if (data.name) authUpdates.user_metadata = { full_name: data.name, role: 'TEACHER' };

    const { error: authError } = await supabase.auth.admin.updateUserById(teacherId, authUpdates);
    if (authError) {
      throw new BadRequestException('Gagal memperbarui data otentikasi: ' + authError.message);
    }

    // Update in Prisma
    return this.prisma.user.update({
      where: { id: teacherId },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        email: data.email !== undefined ? data.email : undefined,
        nis_nip: data.nis_nip !== undefined ? data.nis_nip : undefined,
        verification_status: data.verification_status !== undefined ? data.verification_status : undefined,
      }
    });
  }

  async deleteTeacher(teacherId: string, adminId: string) {
    const teacher = await this.prisma.user.findUnique({ where: { id: teacherId } });
    if (!teacher || teacher.role !== Role.TEACHER) {
      throw new NotFoundException('Guru tidak ditemukan');
    }

    // Reassign relations to admin to prevent cascading delete of classes and materials
    await this.prisma.$transaction(async (tx) => {
      await tx.class.updateMany({
        where: { teacher_id: teacherId },
        data: { teacher_id: adminId }
      });
      await tx.forumPost.updateMany({
        where: { user_id: teacherId },
        data: { user_id: adminId }
      });
      await tx.forumReply.updateMany({
        where: { user_id: teacherId },
        data: { user_id: adminId }
      });
      await tx.intervention.updateMany({
        where: { teacher_id: teacherId },
        data: { teacher_id: adminId }
      });
    });

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Delete from Supabase Auth
    await supabase.auth.admin.deleteUser(teacherId);

    // Finally delete from Prisma
    return this.prisma.user.delete({ where: { id: teacherId } });
  }

  async getStudents() {
    return this.prisma.user.findMany({
      where: { role: Role.STUDENT },
      select: {
        id: true,
        name: true,
        email: true,
        nis_nip: true,
        school_class: true,
        created_at: true,
        enrollments: {
          include: {
            class: true
          }
        }
      }
    });
  }

  async getClasses() {
    return this.prisma.class.findMany({
      include: {
        teacher: {
          select: { name: true, email: true }
        },
        _count: {
          select: { enrollments: true }
        }
      }
    });
  }

  async getQuizzes() {
    return this.prisma.class.findMany({
      select: {
        id: true,
        name: true,
        teacher: {
          select: { name: true, email: true }
        },
        quizzes: {
          select: {
            id: true,
            title: true,
            _count: { select: { questions: true } }
          }
        },
        modules: {
          select: {
            id: true,
            title: true,
            materials: {
              select: {
                id: true,
                title: true,
                type: true
              }
            }
          }
        }
      }
    });
  }
}
