import { ApiProperty } from "@nestjs/swagger";
import { ProductResponseDto } from "src/modules/products/dto/product-response.dto";

export class CartItemResponseDto{
    @ApiProperty({
        description:'cart item Id',
        example:"123sdf-123sdf-2134-sdf"
    })
    id:string
    @ApiProperty({
        description:'cart Id',
        example:"123sdf-123sdf-2134-sdf"
    })
    cartId:string;

    @ApiProperty({
        description:'Product Id',
        example:"123sdf-123sdf-2134-sdf"
    })
    productId:string;

    @ApiProperty({
        description:'quantity',
        example:3,
    })
    quantity:number;
    
    @ApiProperty({
        description:"Product Detials",
        type:() => ProductResponseDto,
    })
    product: ProductResponseDto;

    @ApiProperty({description:'Creation timestamp'})
    createdAt:Date;

    @ApiProperty({description:'Updated timestmap'})
    updatedAt:Date;
}