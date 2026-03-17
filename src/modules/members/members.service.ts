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
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        age: true,
        gender: true,
        locationName: true,        // ✅ Include location fields
        locationPrivacy: true,
        locationLastUpdated: true,
        isAdmin: true,
        isSuspended: true,
        createdAt: true,
        lastActiveAt: true,
        // Add any other fields you want to expose
      }
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
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
    const { currentPassword, newPassword, locationName, locationPrivacy, ...cleanData } = updateData;
    
    const dataToUpdate: any = { ...cleanData };
    
    // Handle password update
    if (updateData.newPassword) {
      dataToUpdate.password = updateData.newPassword;
    }

    // Handle location update
    if (locationName !== undefined) {
      dataToUpdate.locationName = locationName;
      dataToUpdate.locationLastUpdated = new Date();
    }

    if (locationPrivacy !== undefined) {
      dataToUpdate.locationPrivacy = locationPrivacy;
      dataToUpdate.locationLastUpdated = new Date();
    }
  
    const updated = await this.prisma.member.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        age: true,
        gender: true,
        locationName: true,
        locationPrivacy: true,
        locationLastUpdated: true,
        isAdmin: true,
        isSuspended: true,
        createdAt: true,
        lastActiveAt: true,
      }
    });
  
    return updated;
  }

  // ============ NEW: DEDICATED LOCATION UPDATE ============
  
  async updateLocation(
    userId: string, 
    locationData: { locationName?: string; locationPrivacy?: 'exact' | 'city' | 'country' | 'none' }
  ) {
    const member = await this.prisma.member.findUnique({
      where: { id: userId }
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const updated = await this.prisma.member.update({
      where: { id: userId },
      data: {
        locationName: locationData.locationName,
        locationPrivacy: locationData.locationPrivacy,
        locationLastUpdated: new Date(),
      },
      select: {
        id: true,
        name: true,
        locationName: true,
        locationPrivacy: true,
        locationLastUpdated: true,
      }
    });

    return updated;
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