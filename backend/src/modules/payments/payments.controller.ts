/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { CreatePaymentIntentApiResponseDto, PaymentApiResponseDto } from './dto/payment-response.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@Controller('payments')
@ApiBearerAuth('JWT-auth')
@ApiTags('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
    constructor (private readonly paymentsService:PaymentsService){}

    @Post('create-intent')
    @ApiOperation({
        summary:'create payment intent',
        description:'create payment intent for an order'
    })
    @ApiCreatedResponse({
        description:'Payment intent created successfully',
        type:CreatePaymentIntentApiResponseDto
    })
    @ApiBadRequestResponse({
        description:'invalid data or order notfound'
    })
    async createPaymentIntent(@Body() createPaymentIntentDto:CreatePaymentIntentDto, @GetUser('id') userId:string){
        return await this.paymentsService.createPaymentIntent(userId, createPaymentIntentDto);
    }

    @Post('confirm')
    @ApiOperation({
        summary:'Confirm payment',
        description:'Confirm a payment intent for an order',
    })
    @ApiResponse({
        status:200,
        description:'Payment confirmed successfully',
        type:PaymentApiResponseDto
    })
    @ApiBadRequestResponse({
        description:'Payment not found or already completed',
    })
    async confirmPayment(@Body() confirmPaymentDto: ConfirmPaymentDto, @GetUser('id') userId:string){
        return await this.paymentsService.confirmPayment(confirmPaymentDto,userId);
    }

    //Get payment
    @Get()
    @ApiOperation({
        summary:'Get all payments',
        description:"Get all payments for the current user"
    })
    @ApiOkResponse({
        description:"payments retrived successfully",
        type:PaymentApiResponseDto,
    })
    async findAll(@GetUser('id') userId:string){
        return await this.paymentsService.findAll(userId);
    }

    @Get(':id')
    @ApiParam({
        name:'id',
        description:'Payment Id',
        example:'1234123d23-234-123dsdf-213'
    })
    @ApiOperation({
        summary:'Get payment by Id',
        description:'Get a specific payment by its Id'
    })
    @ApiResponse({
        description:'Payment retrived successfully',
        type:PaymentApiResponseDto
    })
    @ApiNotFoundResponse({
        description:"Payment not found",
    })
    async findOne(@Param('id') id:string, @GetUser('id') userId:string){
        return await this.paymentsService.findOne(id,userId);
    }

    //Get payment by order

    @Get('order/:orderId')
    @ApiParam({
        name:'orderId',
        description:'Order Id',
        example:'order-123'
    })
    @ApiOperation({
        summary:'Get payment by order Id',
        description:'Get payment informatino for a specific order'
    })
    @ApiOkResponse({
        description:'Payment retived successfully'
    })
    @ApiNotFoundResponse({
        description:"Payment not found",
    })
    async findByOrder(@Param('orderId') orderId:string,@GetUser('id') userId:string){
        return await this.paymentsService.findByOrder(orderId,userId);
    }
}
