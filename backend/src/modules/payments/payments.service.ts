/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import Stripe from 'stripe';
import * as nodemailer from 'nodemailer';
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
            include: { user: true, orderItems: { include: { product: true } } }
        })

        if(order?.cartId){
            await this.prisma.cart.update({
                where:{id:order.cartId},
                data:{checkedOut:true},
            })
        }
        
        if (order) {
            await this.sendOrderReceiptEmail(order);
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

    private async sendOrderReceiptEmail(order: any) {
        if (!order.user || !order.user.email) return;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'hubstyle06@gmail.com',
                pass: 'bnbz waii uihr cmpu',
            },
        });

        const itemsHtml = order.orderItems.map((item: any) => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eeeff2;">${item.product?.name || 'Item'}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eeeff2; text-align: center;">${item.quantity}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eeeff2; text-align: right;">$${Number(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('');

        const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order.id}`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <div style="background-color: #4f46e5; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">Payment Successful!</h1>
                </div>
                
                <div style="padding: 30px; background-color: #f9fafb; border: 1px solid #eeeff2; border-top: none;">
                    <p style="font-size: 16px;">Hi <strong>${order.user.firstName || 'Customer'}</strong>,</p>
                    <p style="font-size: 16px; line-height: 1.5;">Thank you for your purchase! We've successfully received your payment. Below is the summary of your order:</p>
                    
                    <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 25px 0; border: 1px solid #eeeff2;">
                        <h3 style="margin-top: 0; color: #111827; border-bottom: 2px solid #eeeff2; padding-bottom: 10px;">Order #${order.id.slice(0, 8).toUpperCase()}...</h3>
                        
                        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                            <thead>
                                <tr>
                                    <th style="padding: 12px; border-bottom: 2px solid #eeeff2; text-align: left; color: #6b7280;">Product</th>
                                    <th style="padding: 12px; border-bottom: 2px solid #eeeff2; text-align: center; color: #6b7280;">Qty</th>
                                    <th style="padding: 12px; border-bottom: 2px solid #eeeff2; text-align: right; color: #6b7280;">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colspan="2" style="padding: 15px 12px; text-align: right; font-weight: bold; font-size: 16px;">Total Amount:</td>
                                    <td style="padding: 15px 12px; text-align: right; font-weight: bold; font-size: 18px; color: #4f46e5;">$${Number(order.totalAmount).toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div style="text-align: center; margin-top: 35px; margin-bottom: 20px;">
                        <a href="${trackingUrl}" style="background-color: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Track Your Live Order</a>
                    </div>
                </div>
                
                <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 14px;">
                    <p>If you have any questions, reply to this email or contact our support team.</p>
                </div>
            </div>
        `;

        try {
            await transporter.sendMail({
                from: 'hubstyle06@gmail.com',
                to: order.user.email,
                subject: 'Order Receipt & Tracking Information',
                html: html,
            });
        } catch (err) {
            console.error("Failed to send receipt email:", err);
        }
    }
}
