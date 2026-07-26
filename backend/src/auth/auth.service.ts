import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        mobile: loginDto.mobile,
      },
      include: {
        employee: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid Mobile Number');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    console.log('===================================');
    console.log('Entered Mobile :', loginDto.mobile);
    console.log('Entered Password :', loginDto.password);
    console.log('Stored Hash :', user.password);
    console.log('===================================');

    const passwordMatched = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    console.log('Password Matched :', passwordMatched);
    console.log('===================================');

    if (!passwordMatched) {
      throw new UnauthorizedException('Invalid Password');
    }

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