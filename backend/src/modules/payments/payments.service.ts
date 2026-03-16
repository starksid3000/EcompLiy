/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaymentStatus, Prisma } from '@prisma/client';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
@Injectable()
export class PaymentsService {
    private stripe:Stripe;

    constructor(private prisma:PrismaService){
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
           apiVersion: '2025-12-15.clover' as any,
        })
    }
    
    // Create Payment intent
    async createPaymentIntent(userId:string, createPaymentIntentDto:CreatePaymentIntentDto):Promise<{
        success:boolean;
        data :{clientSecret:string; paymentId:string};
        message:string;
    }>{
        const { orderId, amount, currency="usd"} = createPaymentIntentDto;

        const order = await this.prisma.order.findFirst({
            where:{id:orderId, userId},
        })
        if(!order){
            throw new NotFoundException(`Order with Id ${orderId} not found`);
        }
        const existingPayment = await this.prisma.payment.findFirst({
            where:{orderId},
        })
        if(existingPayment && existingPayment.status === PaymentStatus.COMPLETED){
            throw new BadRequestException('Payment already complted for this order');
        }
        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(amount*100),
            currency,
            metadata:{orderId, userId}
        })
        const payment=await this.prisma.payment.create({
            data:{
                orderId,
                userId,
                amount,
                currency,
                status: PaymentStatus.PENDING,
                paymentMethod:'STRIPE',
                transactionId: paymentIntent.id,
            }
        })

        return {
            success:true,
            data:{
                clientSecret:paymentIntent.client_secret!,
                paymentId:payment.id,
            },
            message:'Payment intent created successfully',
        }
    }

    //ConfirmPayment
    async confirmPayment( confirmPaymentDto:ConfirmPaymentDto, userId:string):Promise<{
        success:boolean;
        data:PaymentResponseDto;
        message:string
    }>{
        const {paymentIntentId, orderId} = confirmPaymentDto;

        const payment = await this.prisma.payment.findFirst({
            where:{
                orderId,
                userId,
                transactionId:paymentIntentId
            }
        })
        if(!payment)
            throw new NotFoundException('payment not found')

        if(payment.status === PaymentStatus.COMPLETED){
            throw new BadRequestException('Payment already completed')
        }
        const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

        if(paymentIntent.status !== 'succeeded')
            throw new BadRequestException('Payment not successful')

        const [updatedPayment] = await this.prisma.$transaction([
            this.prisma.payment.update({
                where:{id:payment.id},
                data:{status: PaymentStatus.COMPLETED},
            }),
            this.prisma.order.update({
                where:{id:orderId},
                data:{status:'PROCESSING'},
            })
        ])
        const order = await this.prisma.order.findFirst({
            where:{
                id:orderId,
            },
        })

        if(order?.cartId){
            await this.prisma.cart.update({
                where:{id:order.cartId},
                data:{checkedOut:true},
            })
        }
        return {
            success:true,
            data: this.mapToPaymentResponse(updatedPayment),
            message:'Payment confirmed successfully',
        }
    }

    //Get all payments for user

    async findAll(userId:string):Promise<{success:boolean; data:PaymentResponseDto[];message:string}>{
        const payments = await this.prisma.payment.findMany({
            where:{userId},
            orderBy:{createdAt:'desc'}
        })
        return{
            success: true,
            data:payments.map((payment) => this.mapToPaymentResponse(payment)),
            message:'Payments retrived successfully'
        }
    }

    //Find one payment
    async findOne(id:string, userId:string) :Promise<{
        status:boolean;
        data:PaymentResponseDto;
        message:string
    }>{
        const payment = await this.prisma.payment.findUnique({
            where:{id,userId},
        })
        if(!payment)
            throw new NotFoundException("Payment with ${id} for ${userId} not found")

        return {
            status:true,
            data:this.mapToPaymentResponse(payment),
            message:"One payment for that user created",
        }
    }

    //find by order
    async findByOrder(orderId:string, userId:string):Promise<{
        status:boolean,
        data:PaymentResponseDto | null,
        message:string;
    }>{
        const payment = await this.prisma.payment.findFirst({
            where:{orderId, userId},
        })
        return {
            status:true,
            data: payment ? this.mapToPaymentResponse(payment) : null,
            message:'Payment retrived successfully'
        }
    }

    
    //Helper
    private mapToPaymentResponse(payment:{
        id:string,
        orderId:string,
        userId:string,
        amount:Prisma.Decimal,
        currency:string,
        status:PaymentStatus,
        paymentMethod:string| null,
        transactionId:string | null,
        createdAt:Date,
        updatedAt:Date
    }):PaymentResponseDto{
        return{
        id:payment.id,
        orderId:payment.orderId,
        userId:payment.userId,
        amount:payment.amount.toNumber(),
        currency:payment.currency,
        status:payment.status,
        paymentMethod:payment.paymentMethod,
        transactionId:payment.transactionId,
        createdAt:payment.createdAt,
        updatedAt:payment.updatedAt
        }
    }
}
