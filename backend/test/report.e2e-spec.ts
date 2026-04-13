import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaTestService } from './prisma-test.service';
import { StorageService } from '../src/modules/storage/storage.service';
import { TestHelpers } from './test-helpers';
import { ReportService } from '../src/modules/report/report.service';

describe('ReportController (e2e)', () => {
  let app: INestApplication;
  let reportService: ReportService;

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

    reportService = app.get(ReportService);
  });

  afterAll(async () => {
    await PrismaTestService.disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await PrismaTestService.cleanDb();
  });

  describe('Admin Reporting Services', () => {
    it('GET /api/v1/report/download -> should be forbidden for standard users', async () => {
      await TestHelpers.registerUser(app, 'user-report@example.com');
      const token = await TestHelpers.getAuthToken(app, 'user-report@example.com');

      const response = await request(app.getHttpServer())
        .get('/api/v1/report/download')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });

    it('GET /api/v1/report/run-report -> should allow Admin to trigger email report', async () => {
      const admin = await TestHelpers.registerUser(app, 'admin-report@example.com');
      await TestHelpers.promoteToAdmin(admin.id);
      const token = await TestHelpers.getAuthToken(app, 'admin-report@example.com');

      // Mock generate and email
      jest.spyOn(reportService, 'generateYesterdayOrdersReport').mockResolvedValue('dummy-path.xlsx');
      jest.spyOn(reportService, 'sendEmail').mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .get('/api/v1/report/run-report')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/sent/i);
    });
  });
});
