/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags, ApiTooManyRequestsResponse, getSchemaPath } from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { OrderApiResponseDto, OrderResponseDto, PaginatedOrderResponseDto } from './dto/order-response.dto';
import { ModerateThrottle, RelaxedThrottle } from 'src/common/decorators/custom-throtler.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { QueryOrderDto } from './dto/query-order.dto';
import { Role } from '@prisma/client';
import { UpdateOrderDto } from './dto/update-order.dto';

@ApiTags('orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
@UseGuards(JwtAuthGuard,RolesGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService){};

    @Post()
    @ModerateThrottle() //limiting absue, controlling how frquenlty a user can create orders.
    // 
    @ApiOperation({
        summary:"Create a new order",
    })
    @ApiBody({
        type: CreateOrderDto,
    })
    @ApiCreatedResponse({
        description:'Order Created successfully',
        type: OrderApiResponseDto,
    })
    @ApiBadRequestResponse({
        description:'Invalid data or insufficient stock',
    })
    @ApiNotFoundResponse({
        description:'Cart not found or empty',
    })
    @ApiTooManyRequestsResponse({
        description:'Too many request-rate limit exceeded',
    })
    async create(@Body() createOrderDto: CreateOrderDto, @GetUser('id') userId:string){
        return await this.ordersService.create(userId, createOrderDto);
    }


    //Get all orders

    @Get('admin/all')
    @Roles(Role.ADMIN)
    @RelaxedThrottle()
    @ApiOperation({
        summary:'ADMIN. Get all orders (pagginated)'
    })
    @ApiQuery({
        name:'status',
        required:false,
        type:String,
    })
    @ApiQuery({
        name:'page',
        required:false,
        type: Number,
    })
    @ApiQuery({
        name:'limit',
        required: false,
        type:Number
    })
    @ApiResponse({
        description:'List of orders',
        schema:{
            type:'object',
            properties:{
                data:{
                    type:"array",
                    items:{$ref: getSchemaPath(OrderResponseDto)},
                },
                total:{type:'number'},
                page:{type:'number'},
                limit:{type:'number'}
            },
        },
    })
    @ApiForbiddenResponse({
        description:"Admin access required",
    })
    async findAllForAdmin(@Query() query:QueryOrderDto){
        return await this.ordersService.findAllForAdmin(query);
    }

    //User Get own orders
    @Get()
    @RelaxedThrottle()
    @ApiOperation({
        summary:"Get all orders for current suer (pagination)"
    })
    @ApiQuery({name:'status', required:false, type:String})
    @ApiQuery({name:'page', required:false, type:Number})
    @ApiQuery({name:'limit', required:false, type:Number})
    @ApiOkResponse({
        description:'List of user orders',
        type:PaginatedOrderResponseDto,
    })
    async findAll(@Query() query: QueryOrderDto, @GetUser('id') userId :string){
        return await this.ordersService.findAll(userId, query);
    }

    //Admin: Get order by id
    @Get('admin/:id')
    @Roles(Role.ADMIN)
    @RelaxedThrottle()
    @ApiOperation({
        summary:"ADMIN - Get order by id",
    })
    @ApiParam({
        name:'id',
        description:'Order Id',
    })
    @ApiOkResponse({
        description:"Order detials",
        type: OrderApiResponseDto,
    })
    @ApiNotFoundResponse({
        description:"Order not found",
    })
    @ApiForbiddenResponse({
        description:"Admin acess required",
    })
    async findOneAdmin(@Param('id') id:string){
        return await this.ordersService.findOne(id);
    }

    //User: Get own order by id
    @Get(':id')
    @RelaxedThrottle()
    @ApiOperation({
        summary:"Get an order by Id for current user",
    })
    @ApiParam({
        name:'id',
        description:'Order Id'
    })
    @ApiOkResponse({
        description:'Order detials',
        type: OrderApiResponseDto
    })
    @ApiNotFoundResponse({
        description:"Order not found",
    })
    async findOne(@Param('id') id:string, @GetUser('id') userId:string){
        return await this.ordersService.findOne(id,userId);
    }

    //Admin update
    @Patch('admin/:id')
    @Roles(Role.ADMIN)
    @ModerateThrottle()
    @ApiOperation({
        summary:"ADMIN update any order"
    })
    @ApiParam({
        name: 'id', description:"Order Id"
    })
    @ApiBody({
        type:UpdateOrderDto
    })
    @ApiOkResponse({
        description:'Order update successfully',
        type:OrderApiResponseDto
    })
    @ApiNotFoundResponse({
        description:"Order not found"
    })
    @ApiForbiddenResponse({
        description:'Admin access only'
    })
    async updateAdmin(@Param('id') id:string, @Body() dto:UpdateOrderDto){
        return await this.ordersService.update(id,dto);
    }

    //User update
    @Patch(':id')
    @ModerateThrottle()
    @ApiOperation({
        summary:"Update your own order"
    })
    @ApiParam({
        name:'id', description:'Order Id'
    })
    @ApiBody({
        type: UpdateOrderDto
    })
    @ApiOkResponse({
        description:'Order updated successfully'
    })
    @ApiNotFoundResponse({
        description:'Order not found'
    })
    async updateUser(@Param(':id') id:string, @Body() dto:UpdateOrderDto,@GetUser('id') userId: string){
        return await this.ordersService.update(id,dto,userId);
    }

    //Admin : cancel an order
    @Delete('admin/:id')
    @Roles(Role.ADMIN)
    @ModerateThrottle()
    @ApiOperation({
        summary:'ADMIN only delete order by id'
    })
    @ApiParam({
        name:'id', description:'Order Id'
    })
    @ApiOkResponse({
        description:'Order cancelled', type: OrderApiResponseDto
    })
    @ApiNotFoundResponse({
        description:'Order not found'
    })
    async cancelAdmin(@Param('id') id:string){
        return await this.ordersService.cancel(id);
    }

    //Cancel order for current user
    @Delete(':id')
    @ModerateThrottle()
    @ApiOperation({
        summary:'User cancel order by id'
    })
    @ApiParam({
        name:'id', description:'Order Id'
    })
    @ApiOkResponse({
        description:'Order cancelled', type: OrderApiResponseDto
    })
    @ApiNotFoundResponse({
        description:'Order not found'
    })
    async cancelUser(@Param('id') id:string,@GetUser('id') userId:string){
        return await this.ordersService.cancel(id,userId);
    }
}

