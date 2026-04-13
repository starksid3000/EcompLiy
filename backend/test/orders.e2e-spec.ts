import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaTestService } from './prisma-test.service';
import { StorageService } from '../src/modules/storage/storage.service';
import { TestHelpers } from './test-helpers';
import { OrdersService } from '../src/modules/orders/orders.service';

describe('OrdersController (e2e)', () => {
  let app: INestApplication;
  let ordersService: OrdersService;

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

    ordersService = app.get(OrdersService);
  });

  afterAll(async () => {
    await PrismaTestService.disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await PrismaTestService.cleanDb();
    // Mock email sending to avoid network errors and speed up tests
    jest.spyOn(ordersService as any, 'sendStatusUpdateEmail').mockResolvedValue(undefined);
  });

  describe('Order Lifecycle', () => {
    it('POST /api/v1/orders -> should create a new order and decrement stock', async () => {
      const email = 'order-test@example.com';
      await TestHelpers.registerUser(app, email);
      const token = await TestHelpers.getAuthToken(app, email);
      const prisma = PrismaTestService.getClient();

      // Setup: Category + Product (Stock: 100)
      const cat = await TestHelpers.createCategory(prisma, 'Gaming', 'gaming');
      const prod = await TestHelpers.createProduct(prisma, 'Xbox', 499, 'XBX-001', cat.id);

      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [{
            productId: prod.id,
            quantity: 5,
            price: 499
          }],
          shippingAddress: {
            fullName: 'Test User',
            mobile: '1234567890',
            house: 'Apt 101',
            street: '123 Main St',
            zipCode: '10001',
            city: 'New York',
            state: 'NY',
            country: 'USA'
          }
        });

      if (response.status !== 201) {
        console.log('Order Creation Failed:', JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(201);
      expect(response.body.data.total).toBe(499 * 5);
      
      // Verify Stock Decrement (100 - 5 = 95)
      const updatedProd = await prisma.product.findUnique({ where: { id: prod.id } });
      expect(Number(updatedProd.stock)).toBe(95);
    });

    it('GET /api/v1/orders -> should return authenticated user orders only', async () => {
      const email = 'user-orders@example.com';
      await TestHelpers.registerUser(app, email);
      const token = await TestHelpers.getAuthToken(app, email);
      
      const response = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });

    it('Admin Access: GET /api/v1/orders/admin/all -> should be allowed for Admin', async () => {
      const email = 'order-admin@example.com';
      const admin = await TestHelpers.registerUser(app, email);
      
      // In case registration failed (e.g. duplicate or other error), try to promote by email
      if (admin && admin.id) {
        await TestHelpers.promoteToAdmin(admin.id);
      } else {
        // Fallback: try to find user by email since we know they should exist after cleanDb
        const prisma = PrismaTestService.getClient();
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) await TestHelpers.promoteToAdmin(user.id);
      }

      const token = await TestHelpers.getAuthToken(app, email);
      const response = await request(app.getHttpServer())
        .get('/api/v1/orders/admin/all')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });
  });
});
