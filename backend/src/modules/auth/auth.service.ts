/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;
  constructor(private prisma: PrismaService) {}

  //register a new user
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
    try {
      const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);
      const user = await this.prisma.user.create({
        data: {
            email, 
            password: hashedPassword,
            firstName,
            lastName
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            password: false
        }
      })

      const tokens = await this.generateTokens(user.id, user.email);
    } catch (error) {}
  } 
}
