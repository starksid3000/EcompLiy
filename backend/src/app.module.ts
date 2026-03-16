import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from './modules/users/users.service';
import { UsersController } from './modules/users/users.controller';
import { UsersModule } from './modules/users/users.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { PaymentsService } from './modules/payments/payments.service';
import { PaymentsController } from './modules/payments/payments.controller';
import { CartModule } from './modules/cart/cart.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal:true,
      envFilePath:'.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl:60, //seconds
        limit: 10, // 10 requests per 60 seconds
      },
  ]),
    PrismaModule,AuthModule, UsersModule, CategoryModule, ProductsModule, OrdersModule, CartModule],
  controllers: [AppController, UsersController, PaymentsController],
  providers: [AppService, UsersService, PaymentsService],
})
export class AppModule {}
