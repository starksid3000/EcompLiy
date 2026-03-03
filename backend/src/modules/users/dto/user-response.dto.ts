//user dto

import { ApiProperty } from "@nestjs/swagger";
import { Role } from "@prisma/client";

export class UserResponseDto{
    @ApiProperty({description: "User Id", example:'124j2h3jh24565j6h5gf5f6'})
    id:string;

    @ApiProperty({description: 'User Email Address', example:'user123@example.com'})
    email:string

    @ApiProperty({description: 'User first name', example: 'Siddharth'})
    firstName: string | null;

    @ApiProperty({description: 'User last name', example: 'Dave'})
    lastName: string | null;

    @ApiProperty({description:' User Role', enum: Role})
    role : Role;

    @ApiProperty({description:' User Created', example: '2026-10-10T12:00:00.7892'})
    createdAt : Date;
    
    @ApiProperty({description:' User Updated', example: '2026-10-10T12:00:00.7892'})
    updatedAt : Date;
}