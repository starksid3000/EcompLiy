/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import * as bcrypt from 'bcrypt';
import {JwtService} from '@nestjs/jwt';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService, 
    ) {}

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
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return {
        ...tokens,
        user,
      }
    } catch (error) {  
      console.error("Error during user registration: ", error);
      throw new InternalServerErrorException('Registratoin failed')
    }
  }

  //Generate access and refresh tokens
  private async generateTokens(userId: string, email: string): Promise<{accessToken: string; refreshToken: string}>{
    // Implementation for token generation
    const payload = { sub: userId, email}
    const refreshId = randomBytes(16).toString('hex'); 
    const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(payload, {expiresIn: '15m'}),
        this.jwtService.signAsync({...payload, refreshId}, {expiresIn:'7d'}),
    ])  
     
    return { accessToken, refreshToken };
  }
  
  async updateRefreshToken(userId: string, refreshToken: string): Promise<void>{
    await this.prisma.user.update({
        where: { id: userId },
        data: { refreshToken }
    });
  }
}
