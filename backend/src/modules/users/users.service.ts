/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Role } from '@prisma/client';
import * as bcyrpt from 'bcrypt';

@Injectable()
export class UsersService {
    private readonly SALT_ROUNDS = 10;
    constructor(private prisma: PrismaService){}

    //Find user with id for admin as well as for user itself.
    async findOne(userId: string): Promise<UserResponseDto>{
        const user = await this.prisma.user.findUnique({
            where:{ id: userId },
            select:{
                id: true,
                email: true,
                firstName:true,
                lastName:true,
                role: true,
                createdAt: true,
                updatedAt: true,
                password: false,
            }
        })
        if(!user){
            throw new NotFoundException('User not found');
        }
        return user;
    }

    //Find all user for admin
    async findAll(): Promise<UserResponseDto[]>{
        return this.prisma.user.findMany({
            select:{
                id: true,
                email: true,
                firstName:true,
                lastName:true,
                role: true,
                createdAt: true,
                updatedAt: true,
                password: false,
            },
            orderBy : { createdAt : 'desc'},
        })
    }
    
    //Update user data
    async update(userId: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto>{
        const exsitingUser = await this.prisma.user.findUnique({
            where : {id: userId}, 
        })
        if(!exsitingUser){
            throw new NotFoundException('User not found')
        }
        if(updateUserDto.email && updateUserDto.email !== exsitingUser.email){
            const emailTaken = await this.prisma.user.findUnique({
                where : {email : updateUserDto.email}
            })
            if(emailTaken){
                throw new NotFoundException('Email already taken')
            }
        }

        //Update user profile
        const updatedUser = await this.prisma.user.update({
            where: {id: userId},
            data: updateUserDto,
            select: {
                id: true,
                email: true,
                firstName:true,
                lastName:true,
                role: true,
                createdAt: true,
                updatedAt: true,
                password: false,
            }
        })
        return updatedUser;
    }

    //Changer user password
    async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{message: string}>{
        const { currentPassword, newPassword } = changePasswordDto;
        const user = await this.prisma.user.findUnique({
            where: {id: userId},
        })
        if(!user){
            throw new NotFoundException('user not found');
        }
        const isPasswordValid = await bcyrpt.compare(currentPassword, user.password)
        if(!isPasswordValid){
            throw new NotFoundException('Current password is incorrect');
        }
        const isSamePassword = await bcyrpt.compare(newPassword, user.password);
        if(isSamePassword){
            throw new NotFoundException('new password must be different from current password');
        }
        const hashNewPassowrd = await bcyrpt.hash(newPassword, this.SALT_ROUNDS);

        await this.prisma.user.update({
            where: {id: userId},
            data: {password: hashNewPassowrd}
        });
        return {message: 'Password updated successfully'};
    }

    //Update user role
    async updateRole(userId: string, newRole: Role): Promise<UserResponseDto> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const firstAdmin = await this.prisma.user.findFirst({
            where: { role: 'ADMIN' },
            orderBy: { createdAt: 'asc' },
        });

        if (firstAdmin && firstAdmin.id === userId) {
            throw new ForbiddenException('Cannot change the role of the first admin');
        }

        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: { role: newRole },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                password: false,
            }
        });
        return updatedUser;
    }

    //remove user
        async remove(userId: string): Promise<{ message: string; }> {
            const user = await this.prisma.user.findUnique({
                where: {id: userId},
            })
            if(!user){
                throw new NotFoundException('user not found');
            }
            await this.prisma.user.delete({
                where: {id:userId},
            })
            return {message:'User account deleted successfully'};
    }
}
