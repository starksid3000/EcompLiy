/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaTestService } from './prisma-test.service';
import { StorageService } from '../src/modules/storage/storage.service';
import { TestHelpers } from './test-helpers';

describe('UsersController (e2e)', () => {
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

  describe('Profile Operations (User Access)', () => {
    it('GET /api/v1/users/me -> should return current user profile', async () => {
      const user = await TestHelpers.registerUser(app, 'me@example.com');
      const token = await TestHelpers.getAuthToken(app, 'me@example.com');

      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('me@example.com');
      expect(response.body.firstName).toBe('Test');
    });

    it('PATCH /api/v1/users/me -> should update profile fields', async () => {
      await TestHelpers.registerUser(app, 'update@example.com');
      const token = await TestHelpers.getAuthToken(app, 'update@example.com');

      const response = await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'UpdatedName' });

      expect(response.status).toBe(200);
      expect(response.body.firstName).toBe('UpdatedName');
    });

    it('PATCH /api/v1/users/me/password -> should change password', async () => {
      await TestHelpers.registerUser(app, 'pass@example.com', 'OldPass123!');
      const token = await TestHelpers.getAuthToken(app, 'pass@example.com', 'OldPass123!');

      const response = await request(app.getHttpServer())
        .patch('/api/v1/users/me/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'OldPass123!',
          newPassword: 'NewPass123!'
        });

      expect(response.status).toBe(200);

      // Verify new password works for login
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'pass@example.com', password: 'NewPass123!' });
      
      expect(loginResponse.status).toBe(200);
    });
  });

  describe('Admin Operations', () => {
    it('GET /api/v1/users -> should be forbidden for standard users', async () => {
      await TestHelpers.registerUser(app, 'standard@example.com');
      const token = await TestHelpers.getAuthToken(app, 'standard@example.com');

      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });

    it('GET /api/v1/users -> should allow Admin to list all users', async () => {
      const admin = await TestHelpers.registerUser(app, 'admin@example.com');
      await TestHelpers.promoteToAdmin(admin.id);
      const token = await TestHelpers.getAuthToken(app, 'admin@example.com');

      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('PATCH /api/v1/users/:id/role -> should allow Admin to change user role', async () => {
      const targetUser = await TestHelpers.registerUser(app, 'target@example.com');
      const admin = await TestHelpers.registerUser(app, 'boss@example.com');
      await TestHelpers.promoteToAdmin(admin.id);
      const token = await TestHelpers.getAuthToken(app, 'boss@example.com');

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/users/${targetUser.id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'ADMIN' });

      expect(response.status).toBe(200);
      expect(response.body.role).toBe('ADMIN');
    });
  });
  it('should able to delete user', async() =>{
    const targetUser = await TestHelpers.registerUser(app, 'target2@example.com')
    const admin = await TestHelpers.registerUser(app, "newadmin@example.com")
    await TestHelpers.promoteToAdmin(admin.id)

    const token = await TestHelpers.getAuthToken(app, 'newadmin@example.com');
    const response = await request(app.getHttpServer())
    .delete(`/api/v1/users/${targetUser.id}`)
    .set('Authorization',`Bearer ${token}`)

    expect(response.status).toBe(200);
    expect(response.status).toBe(200);
expect(response.body).toEqual({
  message: "User account deleted successfully",
});
  })
});
