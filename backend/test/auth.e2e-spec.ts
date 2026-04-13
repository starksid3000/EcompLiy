import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaTestService } from './prisma-test.service';
import { StorageService } from '../src/modules/storage/storage.service';

describe('AuthController (e2e)', () => {
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
    // Wait for the app to initialize
    await app.init();
  });

  afterAll(async () => {
    await PrismaTestService.disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Drop all state before each E2E test runs for massive reliability
    await PrismaTestService.cleanDb();
  });

  describe('/api/v1/auth/register (POST)', () => {
    it('should successfully register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should return 400 if user already exists', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'Password123!',
          firstName: 'Duplicate',
        });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'Password123!',
          firstName: 'Duplicate',
        });

      expect(response.status).toBe(409); // Corrected to 409 Conflict for duplicate user
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login an existing user and return tokens', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'login@example.com',
          password: 'Password123!',
          firstName: 'Login'
        });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should return unauthorized for wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'wrongpass@example.com',
          password: 'Password123!',
          firstName: 'Wrong'
        });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'wrongpass@example.com',
          password: 'WrongPassword!'
        });

      expect(response.status).toBe(401);
    });
  });
});


