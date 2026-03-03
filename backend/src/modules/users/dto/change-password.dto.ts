import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class ChangePasswordDto{
    @ApiProperty({
        description: 'New password for user',
        example: 'New@Passw0rd!'
    })
    @IsString()
    @IsNotEmpty({message: 'new password must not be empty'})
    currentPassword:string;

    @ApiProperty({
        description: 'New password for user',
        example: 'New@Passw0rd!',
        minLength: 8
    })
    @IsString()
    @IsNotEmpty({message: 'new password must not be empty'})
    @MinLength(8, {message : 'Password length must be atleast 8 characters'})
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,{
        message: 'New password must contain atleast one uppercase, one lowercase, one special character and one number'
    })
    newPassword: string;

}