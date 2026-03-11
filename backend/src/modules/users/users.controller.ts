/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UsersService } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';
import type { RequestWithUser } from 'src/common/interfaces/request-with-user.interfaces';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService : UsersService){}

    //get current user profie
    @Get('me')
    @ApiOperation({summary: 'Get Current user profile'})
    @ApiResponse({status: 200, description: 'Current user profile', type: UserResponseDto})
    @ApiResponse({status: 401, description: 'Unauthorized'})
    async getProfile(@Req() req: RequestWithUser): Promise<UserResponseDto>{
        return await this.usersService.findOne(req.user.id);
    }

    //Get all user admin
    @Get()
    @Roles(Role.ADMIN)
    @ApiOperation({summary:"Get all user by id for Admin"})
    @ApiResponse({
        status:200,
        description:"List of all users",
        type: [UserResponseDto],
    })
    async findAll(): Promise<UserResponseDto[]>{
        return await this.usersService.findAll();
    }

    //Get user by Id for admin
    @Get(':id')
    @Roles(Role.ADMIN)
    @ApiOperation({summary:"Get all user for Admin"})
    @ApiResponse({
        status:200,
        description:"The user with specified id",
        type: [UserResponseDto],
    })
    @ApiResponse({status:401, description: 'Unauthorized'})
    @ApiResponse({status:404, description: 'User not found'})
    async findById(@Param('id') id:string) : Promise<UserResponseDto>{
        return await this.usersService.findOne(id);
    }

    //Update user datials
    @Patch('me')
    @ApiOperation({summary: 'Upadate current user profile'})
    @ApiBody({type: UpdateUserDto})
    @ApiResponse({
        status:200,
        description: 'Updated user profile',
        type: UserResponseDto,
    })
    @ApiResponse({description:'Unauthorized access'})
    @ApiResponse({description:'Email already in use'})
    async updateProfile(@GetUser('id') userId: string, @Body() updateUserDto: UpdateUserDto): Promise<UserResponseDto>{
        return await this.usersService.update(userId, updateUserDto)
    }

    //Changer user password
    @Patch('me/password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Change current user Password'})
    @ApiResponse({status:200, description: 'Password changed successfully'})
    @ApiResponse({status:401, description:'Unauthorized'})
    async changePassword(@GetUser('id') userId:string, @Body() changePasswordDto: ChangePasswordDto): Promise<{message: string}>{
        return await this.usersService.changePassword(userId, changePasswordDto);
    }

    //Delete user
    @Delete('me')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Delete current user account'})
    @ApiResponse({status:200, description: 'User deleted successfully'})
    @ApiResponse({status:401, description:'Unauthorized'})
    async deleteAccount(@GetUser('id') userId: string): Promise<{message: string}>{
        return await this.usersService.remove(userId)
    }

    //Delete user by admin
    @Delete(':id')
    @Roles(Role.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Delete user by Id'})
    @ApiResponse({
        status: 200,
        description: 'user with Id deleted successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    async deleteUser(@Param('id') id: string): Promise<{message:string}>{
        return await this.usersService.remove(id);
    }
}
