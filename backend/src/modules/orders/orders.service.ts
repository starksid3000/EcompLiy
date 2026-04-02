/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderApiResponseDto, OrderResponseDto } from './dto/order-response.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Order, OrderItem, OrderStatus, Product, User } from '@prisma/client';
import { QueryOrderDto } from './dto/query-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import * as nodemailer from 'nodemailer';
// import { contains } from 'class-validator';

@Injectable()
export class OrdersService {
    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) { }
    async create(userId: string, createdOrderDto: CreateOrderDto): Promise<OrderApiResponseDto<OrderResponseDto>> {
        const { items, shippingAddress } = createdOrderDto;

        const total = items.reduce(
            (sum, item) => sum + item.price * item.quantity, 0,
        )
        const latestCart = await this.prisma.cart.findFirst({
            where: {
                userId,
                checkedOut: false,
            },
            orderBy: {
                createdAt: 'desc',
            }
        })
        const order = await this.prisma.$transaction(async (tx) => {
            if (latestCart?.id) {
                const existingPendingOrder = await tx.order.findFirst({
                    where: {
                        cartId: latestCart.id,
                        status: OrderStatus.PENDING,
                        userId: userId,
                    },
                    include: { orderItems: true },
                });

                if (existingPendingOrder) {
                    for (const existingItem of existingPendingOrder.orderItems) {
                        await tx.product.update({
                            where: { id: existingItem.productId },
                            data: { stock: { increment: existingItem.quantity } },
                        });
                    }
                    await tx.order.delete({
                        where: { id: existingPendingOrder.id },
                    });
                }
            }
            for (const item of items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                });
                if (!product) {
                    throw new NotFoundException(`Product with Id ${item.productId} not found`);
                }
                if (product.stock < item.quantity) {
                    throw new BadRequestException(`Insufficient stock for product ${product.name}. Available: ${product.stock}, Request: ${item.quantity}`);
                }
            }

            const newOrder = await tx.order.create({
                data: {
                    userId,
                    status: OrderStatus.PENDING,
                    totalAmount: total,
                    shippingAddress,
                    cartId: latestCart?.id,
                    orderItems: {
                        create: items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price,
                        }))
                    }
                },
                include: {
                    orderItems: {
                        include: {
                            product: true,
                        },
                    },
                    user: true,
                },
            });
            for (const item of items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } },
                })
            }
            return newOrder;
        });

        await this.bumpCacheVersion();
        return this.wrap(order);
    }

    async findAllForAdmin(query: QueryOrderDto): Promise<{
        data: OrderResponseDto[],
        total: number,
        page: number,
        limit: number,
    }> {
        const version = await this.getCacheVersion();
        const cacheKey = `orders:admin:v${version}:${JSON.stringify(query)}`;
        const cached = await this.cacheManager.get<any>(cacheKey);
        if (cached) return cached;

        const { page = 1, limit = 10, startDate, endDate, status, search } = query;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status;
        if (startDate || endDate) {
            where.createdAt = {};

            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }

            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }
        if (search) {
            where.OR = [
                { id: { contains: search, mode: 'insensitive' } },
                { orderNumber: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                skip,
                take: limit,
                include: {
                    orderItems: {
                        include: {
                            product: true,
                        }
                    },
                    user: true,
                },
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.order.count({ where })
        ])
        const result = {
            data: orders.map((o) => this.map(o)),
            total,
            page,
            limit,
        };

        await this.cacheManager.set(cacheKey, result, 15000); // 15 second TTL
        return result;
    }

    //Get User current orders
    async findAll(
        userId: string,
        query: QueryOrderDto,
    ): Promise<{
        data: OrderResponseDto[];
        total: number;
        page: number;
        limit: number;
    }> {
        const version = await this.getCacheVersion();
        const cacheKey = `orders:user:${userId}:v${version}:${JSON.stringify(query)}`;
        const cached = await this.cacheManager.get<any>(cacheKey);
        if (cached) return cached;

        const { page = 1, limit = 10, status, search } = query;
        const skip = (page - 1) * limit;

        const where: any = { userId };
        if (status) where.status = status;
        if (search) where.OR = [{ id: { contains: search, mode: 'insensitive' } }];

        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                skip,
                take: limit,
                include: {
                    orderItems: {
                        include: {
                            product: true,
                        },
                    },
                    user: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.order.count({ where }),
        ]);

        const result = {
            data: orders.map((o) => this.map(o)),
            total,
            page,
            limit,
        };

        await this.cacheManager.set(cacheKey, result, 15000);
        return result;
    }

    //Find order by id
    async findOne(id: string, userId?: string): Promise<OrderApiResponseDto<OrderResponseDto>> {
        const where: any = { id };
        if (userId) where.userId = userId;

        const order = await this.prisma.order.findFirst({
            where,
            include: {
                orderItems: {
                    include: {
                        product: true,
                    }
                },
                user: true,
            }
        })
        if (!order) {
            throw new NotFoundException(`Order with id ${id} not found`)
        }
        return this.wrap(order);
    }



    //Update order detials
    async update(id: string, updateOrderDto: UpdateOrderDto, userId?: string): Promise<OrderApiResponseDto<OrderResponseDto>> {
        const where: any = { id };
        if (userId) where.userId = userId;

        const existing = await this.prisma.order.findFirst({
            where,
        })
        if (!existing) throw new NotFoundException(`Order ${id} not found`)

        const updated = await this.prisma.order.update({
            where: { id },
            data: updateOrderDto,
            include: {
                orderItems: {
                    include: {
                        product: true,
                    }
                },
                user: true,
            }
        });

        if (existing.status !== updated.status) {
            await this.sendStatusUpdateEmail(updated);
        }

        await this.bumpCacheVersion();
        return this.wrap(updated);
    }

    //Cancel order : admin

    async cancel(id: string, userId?: string): Promise<OrderApiResponseDto<OrderResponseDto>> {
        const where: any = { id };
        if (userId) where.userId = userId;
        const order = await this.prisma.order.findFirst({
            where,
            include: {
                orderItems: true,
                user: true,
            },
        });
        if (!order) throw new NotFoundException(`Order not found ${id}`)

        if (order.status !== OrderStatus.PENDING) {
            throw new BadRequestException('Only pending orders can be cancelled')
        }
        const cancelled = await this.prisma.$transaction(async (tx) => {
            for (const item of order.orderItems) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } }
                });
            }
            return tx.order.update({
                where: { id },
                data: { status: OrderStatus.CANCELLED },
                include: {
                    orderItems: {
                        include: {
                            product: true,
                        }
                    },
                    user: true,
                }
            })
        });

        await this.bumpCacheVersion();
        return this.wrap(cancelled);
    }

    //Helpers
    private wrap(
        order: Order & {
            orderItems: (OrderItem & { product: Product })[];
            user: User;
        },
    ): OrderApiResponseDto<OrderResponseDto> {
        return {
            success: true,
            message: "Order retrived successfully",
            data: this.map(order),
        }
    }

    private map(
        order: Order & {
            orderItems: (OrderItem & { product: Product })[];
            user: User;
        },
    ): OrderResponseDto {
        return {
            id: order.id,
            userId: order.userId,
            status: order.status,
            total: Number(order.totalAmount),
            shippingAddress: order.shippingAddress ?? '',
            items: order.orderItems.map((item) => ({
                id: item.id,
                productId: item.productId,
                productName: item.product.name,
                quantity: item.quantity,
                price: Number(item.price),
                subtotal: Number(item.price) * item.quantity,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
            })),
            ...(order.user && {
                userEmail: order.user.email,
                userName: `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim(),
            }),
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
        }
    }

    private async sendStatusUpdateEmail(order: any) {
        if (!order.user || !order.user.email) return;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'hubstyle06@gmail.com',
                pass: 'bnbz waii uihr cmpu',
            },
        });

        let statusTitle = "Order Update";
        let statusMessage = `Your order status has been updated to <strong>${order.status}</strong>.`;
        let headerColor = "#4f46e5"; // Indigo default

        switch (order.status) {
            case "PROCESSING":
                statusTitle = "We are preparing your order!";
                statusMessage = "Your order is currently processing and being prepped for shipment.";
                headerColor = "#0284c7"; // Blue
                break;
            case "SHIPPED":
                statusTitle = "Your Order is on the Way!";
                statusMessage = "Great news! Your package has shipped and is officially on its way to you.";
                headerColor = "#0284c7"; // Blue
                break;
            case "DELIVERED":
                statusTitle = "Your Order has been Delivered!";
                statusMessage = "Your package has arrived! We hope you love your new gear.";
                headerColor = "#16a34a"; // Green
                break;
            case "CANCELLED":
                statusTitle = "Order Cancelled";
                statusMessage = "Your order has been cancelled. If you believe this was an error, please reach out to our support team.";
                headerColor = "#dc2626"; // Red
                break;
        }

        const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/orders/${order.id}`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <div style="background-color: ${headerColor}; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0;">${statusTitle}</h1>
                </div>
                
                <div style="padding: 30px; background-color: #f9fafb; border: 1px solid #eeeff2; border-top: none;">
                    <p style="font-size: 16px;">Hi <strong>${order.user.firstName || 'Customer'}</strong>,</p>
                    <p style="font-size: 16px; line-height: 1.5;">${statusMessage}</p>
                    
                    <div style="background-color: white; border-radius: 8px; padding: 25px; margin: 25px 0; border: 1px solid #eeeff2; text-align: center;">
                        <h3 style="margin-top: 0; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Order Number</h3>
                        <p style="font-size: 24px; font-weight: bold; margin: 10px 0; color: #111827;">#${order.id.slice(0, 8).toUpperCase()}</p>
                        
                        <div style="margin-top: 25px;">
                            <span style="display: inline-block; padding: 6px 16px; background-color: ${headerColor}20; color: ${headerColor}; border-radius: 20px; font-weight: bold; text-transform: uppercase; font-size: 14px;">
                                Current Status: ${order.status}
                            </span>
                        </div>
                    </div>

                    <div style="text-align: center; margin-top: 35px; margin-bottom: 20px;">
                        <a href="${trackingUrl}" style="background-color: ${headerColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block;">Track Your Live Order</a>
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
                subject: `Order Update: ${order.status}`,
                html: html,
            });
        } catch (err) {
            console.error("Failed to send status update email:", err);
        }
    }
    //helper 
    private async getCacheVersion(): Promise<number> {
        return (await this.cacheManager.get<number>('orders_version')) || 1;
    }

    private async bumpCacheVersion(): Promise<number> {
        return (await this.cacheManager.set('orders_version', Date.now()));
    }
}
