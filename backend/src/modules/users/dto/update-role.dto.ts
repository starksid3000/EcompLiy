import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";
import { Role } from "@prisma/client";

// Dto for update user role
export class UpdateRoleDto {
    @ApiProperty({
        description: 'New role for the user',
        enum: Role,
        example: 'ADMIN',
    })
    @IsEnum(Role)
    role: Role;
}
