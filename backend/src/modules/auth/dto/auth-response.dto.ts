/* eslint-disable prettier/prettier */
//DTO for auth response
import { Role } from '@prisma/client';
export class AuthResponseDto{
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        firstname: string | null;
        lastname: string | null;
        role : Role;
    }
}