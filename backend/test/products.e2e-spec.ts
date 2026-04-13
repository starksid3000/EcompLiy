import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaTestService } from './prisma-test.service';
import { StorageService } from '../src/modules/storage/storage.service';
import { TestHelpers } from './test-helpers';

describe('ProductsController (e2e)', () => {
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

  describe('Public Product Access', () => {
    it('GET /api/v1/products -> should return paginated products', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/products');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
    });

    it('GET /api/v1/products/suggestions -> should return live search results', async () => {
      const prisma = PrismaTestService.getClient();
      const cat = await TestHelpers.createCategory(prisma, 'SearchCat', 'search-cat');
      await TestHelpers.createProduct(prisma, 'iPhone 15', 999, 'IP15', cat.id);

      const response = await request(app.getHttpServer())
        .get('/api/v1/products/suggestions?q=iph');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0].name).toMatch(/iPhone/i);
    });

    it('GET /api/v1/products/:id -> should return details', async () => {
      const prisma = PrismaTestService.getClient();
      const cat = await TestHelpers.createCategory(prisma, 'DetailCat', 'detail-cat');
      const prod = await TestHelpers.createProduct(prisma, 'Details Prod', 10, 'DET-01', cat.id);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/products/${prod.id}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Details Prod');
    });
  });

  describe('Admin Product Management', () => {
    it('POST /api/v1/products -> should create product as Admin', async () => {
      const admin = await TestHelpers.registerUser(app, 'prod-admin@example.com');
      await TestHelpers.promoteToAdmin(admin.id);
      const token = await TestHelpers.getAuthToken(app, 'prod-admin@example.com');

      const prisma = PrismaTestService.getClient();
      const cat = await TestHelpers.createCategory(prisma, 'AdminCat', 'admin-cat');

      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Admin Product',
          price: 150,
          sku: 'ADM-PROD',
          categoryId: cat.id,
          stock: 10,
          description: 'Created via E2E'
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Admin Product');
    });

    it('PATCH /api/v1/products/:id/stock -> should update stock level', async () => {
      const admin = await TestHelpers.registerUser(app, 'stock-admin@example.com');
      await TestHelpers.promoteToAdmin(admin.id);
      const token = await TestHelpers.getAuthToken(app, 'stock-admin@example.com');

      const prisma = PrismaTestService.getClient();
      const cat = await TestHelpers.createCategory(prisma, 'StockCat', 'stock-cat');
      const prod = await TestHelpers.createProduct(prisma, 'Stock Prod', 10, 'STK-01', cat.id);

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/products/${prod.id}/stock`)
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 50 }); // Note: controller takes quantity in body by key 'quantity'

      expect(response.status).toBe(200);
      expect(response.body.stock).toBe(150); // TestHelper starts with 100, we added 50
    });

    it('PATCH /api/v1/products/:id -> should update regular product fields', async () => {
      const admin = await TestHelpers.registerUser(app, 'patch-admin@example.com');
      await TestHelpers.promoteToAdmin(admin.id);
      const token = await TestHelpers.getAuthToken(app, 'patch-admin@example.com');

      const prisma = PrismaTestService.getClient();
      const cat = await TestHelpers.createCategory(prisma, 'PatchCat', 'patch-cat');
      const prod = await TestHelpers.createProduct(prisma, 'Old Name', 10, 'OLD-01', cat.id);

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/products/${prod.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Shiny Name', price: 20 });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('New Shiny Name');
      expect(Number(response.body.price)).toBe(20);
    });

    it('DELETE /api/v1/products/:id -> should remove product', async () => {
      const admin = await TestHelpers.registerUser(app, 'delete-admin@example.com');
      await TestHelpers.promoteToAdmin(admin.id);
      const token = await TestHelpers.getAuthToken(app, 'delete-admin@example.com');

      const prisma = PrismaTestService.getClient();
      const cat = await TestHelpers.createCategory(prisma, 'DelCat', 'del-cat');
      const prod = await TestHelpers.createProduct(prisma, 'To Be Deleted', 5, 'DEL-01', cat.id);

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/products/${prod.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });
  });
});
