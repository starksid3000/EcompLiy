import { ApiProperty } from "@nestjs/swagger";
import { CartItemResponseDto } from "./cart-item-response.dto";
export class CartResponseDto{
    @ApiProperty({
        description:'Cart Id',
        example:"1231-123dfs-1231d1-345",
    })
    id:string;

    @ApiProperty({
        description:'User id',
        example:'123-23450v-634srd-4567'
    })
    userId:string

    @ApiProperty({
        description:"Cart items",
        type:[CartItemResponseDto],
    })
    cartItems: CartItemResponseDto[];

    @ApiProperty({
        description:'Total cart value',
        example:1500.00
    })
    totalPrice:number;

    @ApiProperty({
        description:'Total items count',
        example:3
    })
    totalItems:number;

    @ApiProperty({description: 'creation tiemstamp'})
    createdAt: Date;

    @ApiProperty({description:'updated timestamp'})
    updatedAt: Date;

}