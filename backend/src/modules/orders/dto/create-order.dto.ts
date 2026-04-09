import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";

class OrderItmDto{
    
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    productId: string;
    
    @ApiProperty()
    @IsNotEmpty()
    @IsNumber()
    quantity: number;

    @ApiProperty({
        example:99.99
    })
    @IsNumber({
        maxDecimalPlaces:2,
    },{
        message : "Price must be a valid number e.g(99.99)"
    })
    @Type(() => Number)
    price: number;
}
export class AddressDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    fullName: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    mobile: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    house: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    street: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    landmark?: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    zipCode: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    city: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    state: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    country: string;
}

export class CreateOrderDto {
    @ApiProperty({type:[OrderItmDto]})
    @IsArray()
    @ValidateNested({each:true})
    @Type(() => OrderItmDto)
    items: OrderItmDto[];

    @ApiProperty({ type: AddressDto })
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => AddressDto)
    shippingAddress: AddressDto;
}