import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaTestService } from './prisma-test.service';
import { StorageService } from '../src/modules/storage/storage.service';
import { TestHelpers } from './test-helpers';

describe('CategoryController (e2e)', () => {
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

  describe('Public Category Access', () => {
    it('GET /api/v1/category -> should return paginated categories', async () => {
      // Manual insert via Prisma to avoid needing admin for setup
      const prisma = PrismaTestService.getClient();
      await TestHelpers.createCategory(prisma, 'Electronics', 'electronics');

      const response = await request(app.getHttpServer())
        .get('/api/v1/category');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data[0].slug).toBe('electronics');
    });

    it('GET /api/v1/category/slug/:slug -> should return single category', async () => {
      const prisma = PrismaTestService.getClient();
      await TestHelpers.createCategory(prisma, 'Books', 'books');

      const response = await request(app.getHttpServer())
        .get('/api/v1/category/slug/books');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Books');
    });
  });

  describe('Admin Category Management', () => {
    it('POST /api/v1/category -> should successfully create category as Admin', async () => {
      const admin = await TestHelpers.registerUser(app, 'cat-admin@example.com');
      await TestHelpers.promoteToAdmin(admin.id);
      const token = await TestHelpers.getAuthToken(app, 'cat-admin@example.com');

      const response = await request(app.getHttpServer())
        .post('/api/v1/category')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Home & Kitchen',
          slug: 'home-kitchen',
          description: 'Appliances and more'
        });

      expect(response.status).toBe(201);
      expect(response.body.slug).toBe('home-kitchen');
    });

    it('DELETE /api/v1/category/:id -> should remove category', async () => {
      const admin = await TestHelpers.registerUser(app, 'del-admin@example.com');
      await TestHelpers.promoteToAdmin(admin.id);
      const token = await TestHelpers.getAuthToken(app, 'del-admin@example.com');

      const prisma = PrismaTestService.getClient();
      const cat = await TestHelpers.createCategory(prisma, 'Temporary', 'temp');

      const response = await request(app.getHttpServer())
        .delete(`/api/v1/category/${cat.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });
  });
});
