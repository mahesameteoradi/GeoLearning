import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from './auth.decorator';

@Controller('auth')
export class AuthController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get('check-nis')
  async checkNis(@Query('nis') nis: string) {
    if (!nis) {
      throw new BadRequestException('NIS is required');
    }

    const user = await this.prisma.user.findFirst({
      where: { nis_nip: nis },
      select: { id: true },
    });

    return { exists: !!user };
  }

  @Public()
  @Get('check-invitation')
  async checkInvitationCode(@Query('code') code: string) {
    if (!code) {
      throw new BadRequestException('Kode undangan tidak boleh kosong');
    }

    const invitation = await this.prisma.invitationCode.findUnique({
      where: { code },
    });

    if (!invitation) {
      return { valid: false, message: 'Kode undangan tidak ditemukan' };
    }

    if (!invitation.is_active) {
      return { valid: false, message: 'Kode undangan sudah dinonaktifkan' };
    }

    if (invitation.expires_at && new Date() > invitation.expires_at) {
      return { valid: false, message: 'Kode undangan sudah kedaluwarsa' };
    }

    if (invitation.max_uses && invitation.times_used >= invitation.max_uses) {
      return { valid: false, message: 'Kuota kode undangan sudah habis' };
    }

    return { valid: true };
  }

  @Public()
  @Post('record-invitation')
  async recordInvitation(@Body() body: { userId: string; code: string }) {
    if (!body.userId || !body.code) {
      throw new BadRequestException('userId and code are required');
    }

    const invitation = await this.prisma.invitationCode.findUnique({
      where: { code: body.code },
    });

    if (
      !invitation ||
      !invitation.is_active ||
      (invitation.expires_at && new Date() > invitation.expires_at) ||
      (invitation.max_uses && invitation.times_used >= invitation.max_uses)
    ) {
      throw new BadRequestException('Kode undangan tidak valid');
    }

    // Record usage
    await this.prisma.$transaction([
      this.prisma.invitationCodeLog.create({
        data: {
          invitation_code_id: invitation.id,
          used_by_id: body.userId,
        },
      }),
      this.prisma.invitationCode.update({
        where: { id: invitation.id },
        data: { times_used: { increment: 1 } },
      }),
    ]);

    return { success: true };
  }

  @Public()
  @Post('resolve-identifier')
  async resolveIdentifier(@Body('identifier') identifier: string) {
    if (!identifier) {
      throw new BadRequestException('Identifier is required');
    }

    // Attempt to match by exact email, exact NIPD, or case-insensitive Name
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { nis_nip: identifier },
          { name: { equals: identifier, mode: 'insensitive' } },
        ],
      },
      select: { email: true },
    });

    if (!user) {
      return { success: false, message: 'Akun tidak ditemukan' };
    }

    return { success: true, email: user.email };
  }
}
