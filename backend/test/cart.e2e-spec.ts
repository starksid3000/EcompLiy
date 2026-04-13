import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaTestService } from './prisma-test.service';
import { StorageService } from '../src/modules/storage/storage.service';
import { TestHelpers } from './test-helpers';

describe('CartController (e2e)', () => {
  let app: INestApplication;

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
  });

  afterAll(async () => {
    await PrismaTestService.disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await PrismaTestService.cleanDb();
  });

  describe('Cart Lifecycle', () => {
    it('GET /api/v1/cart -> should return an empty cart initially', async () => {
      await TestHelpers.registerUser(app, 'cart@example.com');
      const token = await TestHelpers.getAuthToken(app, 'cart@example.com');

      const response = await request(app.getHttpServer())
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('cartItems');
      expect(response.body.cartItems.length).toBe(0);
    });

    it('POST /api/v1/cart/items -> should add a product to the cart', async () => {
      const email = 'add-item@example.com';
      await TestHelpers.registerUser(app, email);
      const token = await TestHelpers.getAuthToken(app, email);
      const prisma = PrismaTestService.getClient();

      // Setup: Category + Product
      const cat = await TestHelpers.createCategory(prisma, 'Gaming', 'gaming');
      const prod = await TestHelpers.createProduct(prisma, 'PS5', 499, 'PS5-001', cat.id);

      const response = await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId: prod.id,
          quantity: 2
        });

      expect(response.status).toBe(201);
      expect(response.body.cartItems.length).toBe(1);
      expect(response.body.cartItems[0].product.name).toBe('PS5');
      expect(Number(response.body.cartItems[0].quantity)).toBe(2);
    });

    it('DELETE /api/v1/cart -> should clear all items', async () => {
      const email = 'clear@example.com';
      await TestHelpers.registerUser(app, email);
      const token = await TestHelpers.getAuthToken(app, email);
      const prisma = PrismaTestService.getClient();

      const cat = await TestHelpers.createCategory(prisma, 'Audio', 'audio');
      const prod = await TestHelpers.createProduct(prisma, 'Sony WH-1000XM4', 350, 'SONY-XM4', cat.id);

      // Add item first
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId: prod.id, quantity: 1 });

      // Clear cart
      const response = await request(app.getHttpServer())
        .delete('/api/v1/cart')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.cartItems.length).toBe(0);
    });
  });
});
