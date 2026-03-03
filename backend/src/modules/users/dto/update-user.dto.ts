import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString } from "class-validator";

//Dto for update user data
export class UpdateUserDto{
    @ApiProperty({
        description: 'User email address',
        example: 'user@example.com',
        required:false,
    })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({
        description: 'User first name',
        example: 'siddharth',
        required:false,
    })
    @IsOptional()
    @IsString()
    firstName?: string;

        @ApiProperty({
        description: 'User last name',
        example: 'dave',
        required:false,
    })
    @IsOptional()
    @IsString()
    lastName?: string;
}