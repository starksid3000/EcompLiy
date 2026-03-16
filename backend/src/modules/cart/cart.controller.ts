/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CartResponseDto } from './dto/cart-response.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { UpdateCartItemDto } from './dto/update-cart.-item.dto';
import { MergeCartDto } from './dto/merge-cart.dto';

@ApiTags('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@Controller('cart')
export class CartController {
    constructor(private readonly cartSerivce: CartService){}

    //Get user cart
    @Get()
    @ApiOperation({summary:'Get current user cart'})
    @ApiResponse({
        status:200,
        description:'User cart with items',
        type: CartResponseDto,
    })
    async getCart(@GetUser('id') userId:string):Promise<CartResponseDto>{
        return this.cartSerivce.getOrCreateActiveCart(userId);
    }

    //add item to cart

    @Post('items')
    @ApiOperation({summary:'Add item to cart'})
    @ApiBody({type:AddToCartDto})
    @ApiResponse({
        status:201,
        description:'Item added to cart',
        type:CartResponseDto,
    })
    @ApiResponse({status:404, description:'product not foudn'})
    @ApiResponse({
        status:400,
        description:'Product unavailable or insufficient stock',
    })
    async addToCart(@GetUser('id') userId:string,@Body() addToCartDto:AddToCartDto):Promise<CartResponseDto>{
        return this.cartSerivce.addToCart(userId, addToCartDto);
    }

    //Update cartitems
    @Patch('items/:id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:'Update cart item quantity'
    })
    @ApiBody({type:UpdateCartItemDto})
    @ApiResponse({
        status:200,
        description:'Cart item updated',
        type:CartResponseDto
    })
    @ApiResponse({status:404, description:"Cart Item not found"})
    @ApiResponse({status:400, description:'Insufficient stock'})
    async updateCartItem(@GetUser('id') userId:string, @Param('id') id:string,@Body() updateCartItemDto:UpdateCartItemDto):Promise<CartResponseDto>{
        return this.cartSerivce.updateCartItem(userId, id, updateCartItemDto);
    }

    //Delete Cart item
  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({
    status: 200,
    description: 'Item removed from cart',
    type: CartResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async removeFromCart(
    @GetUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<CartResponseDto> {
    return this.cartSerivce.removeFromCart(userId, id);
  }
    
  // DELETE /cart
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all items from cart' })
  @ApiResponse({
    status: 200,
    description: 'Cart cleared',
    type: CartResponseDto,
  })
  async clearCart(@GetUser('id') userId: string): Promise<CartResponseDto> {
    return this.cartSerivce.clearCart(userId);
  }

  //Merge guest cart to user
  @Post('merge')
  @ApiOperation({summary:'Merge guest cart into user cart'})
  @ApiBody({type:MergeCartDto})
  @ApiResponse({
    status:200,
    description:'Merged cart',
    type:CartResponseDto 
  })
  async mergeCart(@GetUser('id') userId:string,@Body() mergeCartDto:MergeCartDto):Promise<CartResponseDto>{
    return this.cartSerivce.mergeCart(userId,mergeCartDto.items);
  }
}
