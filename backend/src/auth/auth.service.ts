import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private static failedLoginAttempts = new Map<string, { count: number; firstAttempt: number }>();
  private static readonly LOCK_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  private static readonly MAX_ATTEMPTS = 5;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    // Simple in-memory rate limiter per mobile number
    const now = Date.now();
    const record = AuthService.failedLoginAttempts.get(loginDto.mobile);

    if (record) {
      if (now - record.firstAttempt <= AuthService.LOCK_WINDOW_MS && record.count >= AuthService.MAX_ATTEMPTS) {
        throw new UnauthorizedException('Too many login attempts. Try again later.');
      }

      if (now - record.firstAttempt > AuthService.LOCK_WINDOW_MS) {
        AuthService.failedLoginAttempts.delete(loginDto.mobile);
      }
    }
    const user = await this.prisma.user.findUnique({
      where: {
        mobile: loginDto.mobile,
      },
      include: {
        employee: true,
      },
    });

    if (!user) {
      // record failed attempt for unknown mobile to mitigate brute-force/user enumeration
      if (record && now - record.firstAttempt <= AuthService.LOCK_WINDOW_MS) {
        record.count += 1;
        AuthService.failedLoginAttempts.set(loginDto.mobile, record);
      } else {
        AuthService.failedLoginAttempts.set(loginDto.mobile, { count: 1, firstAttempt: now });
      }

      throw new UnauthorizedException('Invalid Mobile Number');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }


    const passwordMatched = await bcrypt.compare(
      loginDto.password,
      user.password,
    );


    if (!passwordMatched) {
      // record failed attempt
      if (record && now - record.firstAttempt <= AuthService.LOCK_WINDOW_MS) {
        record.count += 1;
        AuthService.failedLoginAttempts.set(loginDto.mobile, record);
      } else {
        AuthService.failedLoginAttempts.set(loginDto.mobile, { count: 1, firstAttempt: now });
      }

      throw new UnauthorizedException('Invalid Password');
    }

    // Successful login: clear failed attempts
    AuthService.failedLoginAttempts.delete(loginDto.mobile);

    const payload = {
      sub: user.id,
      mobile: user.mobile,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: 'Login Successful',
      accessToken,
      user: {
        id: user.id,
        mobile: user.mobile,
        role: user.role,
        employee: user.employee,
      },
    };
  }
}