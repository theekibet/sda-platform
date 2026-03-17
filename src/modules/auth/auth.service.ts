// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { firstName, lastName, email, password, phone, dateOfBirth, gender } = registerDto;
  
    // Combine first and last name
    const fullName = `${firstName} ${lastName}`.trim();
    
    // Check if user already exists
    const existingUser = await this.prisma.member.findFirst({
      where: {
        OR: [
          { email: email || '' },
          { phone: phone || '' },
        ],
      },
    });
  
    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }
  
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Calculate age from date of birth if provided
    let age: number | null = null;
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      // Adjust if birthday hasn't occurred this year
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }
  
    // Create user
    const user = await this.prisma.member.create({
      data: {
        name: fullName,
        email,
        phone,
        password: hashedPassword,
        age: age,
        gender,
        isActive: true,
      },
    });

    // Auto-join General Discussion group
    await this.autoJoinGeneralGroup(user.id);
  
    // Generate JWT token
    const token = this.generateToken(user);
  
    // Remove password from response
    const { password: _, ...result } = user;
  
    return {
      ...result,
      token,
      message: 'Registration successful! Welcome to the community.',
    };
  }
  
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
  
    // Find user by email or phone
    const user = await this.prisma.member.findFirst({
      where: {
        OR: [
          { email },
          { phone: email }, // Allow login with phone too
        ],
      },
    });
  
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
  
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
  
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
  
    // Update last active timestamp
    await this.prisma.member.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() }
    });
  
    // Generate token
    const token = this.generateToken(user);
  
    // Remove password from response
    const { password: _, ...result } = user;
  
    return {
      ...result,
      token,
    };
  }

  generateToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin || false,
    };

    return this.jwtService.sign(payload);
  }

  async validateUser(userId: string) {
    const user = await this.prisma.member.findUnique({
      where: { id: userId },
    });

    if (user) {
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  private async autoJoinGeneralGroup(userId: string) {
    try {
      // Find or create General Discussion group
      let generalGroup = await this.prisma.group.findFirst({
        where: { name: 'General Discussion' }
      });

      if (!generalGroup) {
        // Find an admin to be the creator
        const admin = await this.prisma.member.findFirst({
          where: { isAdmin: true }
        });

        generalGroup = await this.prisma.group.create({
          data: {
            name: 'General Discussion',
            description: 'Open conversations about faith, life, and everything. This is our community hub!',
            category: 'GENERAL',
            isPrivate: false,
            requireApproval: false,
            isDefault: true,
            allowAnonymous: true,
            createdById: admin?.id || userId, // Use admin if exists, otherwise the new user
          },
        });
        console.log('✅ Created General Discussion group');
      }

      // Check if already a member
      const existingMember = await this.prisma.groupMember.findUnique({
        where: {
          groupId_memberId: {
            groupId: generalGroup.id,
            memberId: userId,
          },
        },
      });

      if (!existingMember) {
        // Add user to group
        await this.prisma.groupMember.create({
          data: {
            groupId: generalGroup.id,
            memberId: userId,
            role: 'member',
            status: 'approved',
          },
        });

        // Update member count
        await this.prisma.group.update({
          where: { id: generalGroup.id },
          data: { memberCount: { increment: 1 } },
        });

        console.log(`✅ User ${userId} auto-joined General Discussion group`);
      }
    } catch (error) {
      console.error('❌ Failed to auto-join General Discussion group:', error);
    }
  }
}