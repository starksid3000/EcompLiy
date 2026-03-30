/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, Get, Req, Res } from '@nestjs/common';
import { GoogleAuthGuard } from 'src/common/guards/google-auth.guard';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService){}

    //Register api
    @Post('register')
    @HttpCode(201)
    @ApiOperation({
        summary:"Register a new user",
        description:"Creates a new user account",
    })
    @ApiResponse({
        status:201,
        description: 'User successfully registered',
        type: AuthResponseDto,
    })
    @ApiResponse({
        status:400,
        description:"Bad Request. Validation failed or user already exists",
    })
    @ApiResponse({
        status:500,
        description:"Internal server error",
    })
    @ApiResponse({
        status:429,
        description:"Too Many Requests. Rate Limit exceeded",
    })
    async register(@Body() registerDto: RegisterDto) : Promise<AuthResponseDto>{
        return await this.authService.register(registerDto);
    }

    //refresh access token
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @UseGuards(RefreshTokenGuard)
    @ApiBearerAuth('JWT-refresh')
    @ApiOperation({
        summary:"Refresh access token",
        description:"Generate a new access token using a vaid refresh token",
    })
    @ApiResponse({
        status:200,
        description: 'New access token generated successfully ',
        type: AuthResponseDto,
    })
    @ApiResponse({
        status:400,
        description:"Unauthorized. Invalid or expired refesh token",
    })
    @ApiResponse({
        status:429,
        description:"Too Many Requests. Rate Limit exceeded",
    })
    async refresh(@GetUser('id') userId: string): Promise<AuthResponseDto>{
        return await this.authService.refreshTokens(userId);
    }

    //logout and remove access token
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({
        summary: 'Logout user',
        description: 'Logs out the user and invalidates the refresh token',
    })
    @ApiResponse({
        status:200,
        description: 'User successfully logged out',
        type: AuthResponseDto,
    })
    @ApiResponse({
        status:401,
        description:"Unauthorized. Invalid or expired refesh token",
    })
    @ApiResponse({
        status:429,
        description:"Too Many Requests. Rate Limit exceeded",
    })
    async logout(@GetUser('id') userId: string): Promise<{message: string}>{
        await this.authService.logout(userId);
        return {message: 'Successfully logged out'}
    }

    //login
    @Post('login')
    @ApiOperation({
        summary: 'Login user',
        description: 'Authenticates a user and returns access and refresh tokens',
    })
    @ApiResponse({
        status:200,
        description: 'User successfully logged in',
        type: AuthResponseDto,
    })
    @ApiResponse({
        status:401,
        description:"Unauthorized. Invalid or expired refesh token",
    })
    @ApiResponse({
        status:429,
        description:"Too Many Requests. Rate Limit exceeded",
    })
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto>{
        return await this.authService.login(loginDto);
    }
    @Get('google')
    @UseGuards(GoogleAuthGuard)
    @ApiOperation({ summary: 'Initiate Google OAuth login' })
    async googleAuth(@Req() req: any) {
        // Initiates the Google OAuth2 login flow
    }

    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    @ApiOperation({ summary: 'Google OAuth callback' })
    async googleAuthRedirect(@Req() req: any, @Res() res: any) {
        const response = await this.authService.googleLogin(req);
        // We fallback to localhost:5173 for local dev frontend URL
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${response.accessToken}&refreshToken=${response.refreshToken}&userId=${response.user.id}&firstName=${encodeURIComponent(response.user.firstName || '')}`;
        return res.redirect(redirectUrl);
    }
}
