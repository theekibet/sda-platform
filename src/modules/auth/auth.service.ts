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
        // city field removed
        isActive: true,
      },
    });
  
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
}