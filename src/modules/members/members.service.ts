import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Member } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string): Promise<Member> {
    const member = await this.prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }

    return member;
  }

  // ============ PROFILE METHODS ============
  
  async getProfile(userId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: userId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const { password, ...profile } = member;
    return profile;
  }

  async updateProfile(userId: string, updateData: UpdateProfileDto) {
    const member = await this.prisma.member.findUnique({
      where: { id: userId }
    });
  
    if (!member) {
      throw new NotFoundException('Member not found');
    }
  
    // Handle password change if requested
    if (updateData.currentPassword && updateData.newPassword) {
      const isPasswordValid = await bcrypt.compare(
        updateData.currentPassword,
        member.password
      );
  
      if (!isPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
  
      // Hash new password
      updateData.newPassword = await bcrypt.hash(updateData.newPassword, 10);
    }
  
    // Prepare data for update
    const { currentPassword, newPassword, ...cleanData } = updateData;
    
    const dataToUpdate: any = { ...cleanData };
    
    // Handle password update
    if (updateData.newPassword) {
      dataToUpdate.password = updateData.newPassword;
    }
  
    const updated = await this.prisma.member.update({
      where: { id: userId },
      data: dataToUpdate,
    });
  
    const { password, ...profile } = updated;
    return profile;
  }
  async updateProfilePicture(userId: string, avatarUrl: string): Promise<Member> {
    return this.prisma.member.update({
      where: { id: userId },
      data: { avatarUrl },
    });
  }
  
  async removeProfilePicture(userId: string): Promise<void> {
    await this.prisma.member.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: userId }
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, member.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.member.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return { message: 'Password updated successfully' };
  }

}
