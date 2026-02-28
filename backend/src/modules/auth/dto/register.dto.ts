/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
//Data Transfer Object(DTO) for user registration
//dto help validate input and improve ts safety and generate api doc, it define shape and and validation rule for data
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class RegisterDto{
    @IsEmail({}, {message :'Please provide a vaild email address'})
    @IsNotEmpty({message : 'email is required'})
    email: string;

    @IsString()
    @IsNotEmpty({message : 'Password is required'})
    @MinLength(8, {message : 'Password must be at least 8 Characters'})
    @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
        message:
            'Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be at least 8 characters long',
    })
    password: string;

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

}
