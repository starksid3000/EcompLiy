/* eslint-disable prettier/prettier */
//DTO for auth response
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
export class AuthResponseDto{

    @ApiProperty({
        description: 'Access token for authentication',
        example: '9a2f7c7bf69d4983a98bf5b28e38bf5de66d06a4ff94cdea18aaff2d917ff933a3308218afd7c3f6539451cf7789d2957c21973421416115a8e8fe5213b7639f',
    })
    accessToken: string;


    @ApiProperty({
        description: 'Refresh token for obtain new access tokens',
        example: 'e3469206faad8970ef5458cb55ccebc6c89337b58f053e370f42fcf7919d8a1803bc8083d24ab2648c9bdca589a8b38e1a224c729ade51a38af95b86f90da182b5f7d31960220a9272a6506aaac416e1d5422e7107a54b7c739a2ff0bb78757bd72218c3b0f0ac2d33470c2d1bdae070dfeab44ffd50a4cb44e94477',
    })    
    refreshToken: string;

    @ApiProperty({
        description: 'Authenticated user information',
        example: {
            id: 'user-123',
            email: '<EMAIL>',
            firstName: 'Siddharth',
            lastName: 'Dave',
            role: 'USER',
        },
    })  
    user: {
        id: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
        role : Role;
    }
}