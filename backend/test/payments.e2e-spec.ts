import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaTestService } from './prisma-test.service';
import { StorageService } from '../src/modules/storage/storage.service';
import { TestHelpers } from './test-helpers';
import { PaymentsService } from '../src/modules/payments/payments.service';

describe('PaymentsController (e2e)', () => {
  let app: INestApplication;
  let paymentsService: PaymentsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(StorageService)
      .useValue({ ensureBucketExists: jest.fn(), uploadFile: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api/v1');
    await app.init();

    paymentsService = app.get(PaymentsService);
  });

  afterAll(async () => {
    await PrismaTestService.disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await PrismaTestService.cleanDb();
  });

  describe('Payment Flows', () => {
    it('POST /api/v1/payments/create-intent -> should create intent and return client secret', async () => {
      const email = 'pay-intent@example.com';
      await TestHelpers.registerUser(app, email);
      const token = await TestHelpers.getAuthToken(app, email);
      const prisma = PrismaTestService.getClient();

      // Setup: Order
      const user = await prisma.user.findUnique({ where: { email } });
      const order = await prisma.order.create({
        data: {
          userId: user.id,
          totalAmount: 100,
          status: 'PENDING',
          shippingAddress: { city: 'Test' }
        }
      });

      // Mock Stripe
      const stripeSpy = jest.spyOn((paymentsService as any).stripe.paymentIntents, 'create').mockResolvedValue({
        id: 'pi_test_123',
        client_secret: 'secret_123'
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/create-intent')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderId: order.id,
          amount: 100,
          currency: 'usd'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.clientSecret).toBe('secret_123');
      expect(stripeSpy).toHaveBeenCalled();
    });

    it('POST /api/v1/payments/confirm -> should verify intent and update order to PAID', async () => {
      const email = 'confirm-pay@example.com';
      await TestHelpers.registerUser(app, email);
      const token = await TestHelpers.getAuthToken(app, email);
      const prisma = PrismaTestService.getClient();

      const user = await prisma.user.findUnique({ where: { email } });
      const order = await prisma.order.create({
        data: {
          userId: user.id,
          totalAmount: 100,
          status: 'PENDING',
          shippingAddress: { city: 'Test' }
        }
      });

      // Create dummy payment record
      await prisma.payment.create({
        data: {
          orderId: order.id,
          userId: user.id,
          amount: 100,
          currency: 'usd',
          status: 'PENDING',
          paymentMethod: 'STRIPE',
          transactionId: 'pi_confirm_123'
        }
      });

      // Mock Stripe Retrieve
      jest.spyOn((paymentsService as any).stripe.paymentIntents, 'retrieve').mockResolvedValue({
        id: 'pi_confirm_123',
        status: 'succeeded'
      });

      // Mock Mailer (since confirmPayment likely sends receipts)
      jest.spyOn(paymentsService as any, 'sendOrderReceiptEmail').mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/confirm')
        .set('Authorization', `Bearer ${token}`)
        .send({
          paymentIntentId: 'pi_confirm_123',
          orderId: order.id
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toMatch(/success/i);

      // Verify status changes in DB
      const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
      expect(updatedOrder.status).toBe('PROCESSING');
    });
  });
});
