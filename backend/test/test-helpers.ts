/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

export class TestHelpers {
  private static prisma: PrismaClient;

  private static getPrisma() {
    if (!this.prisma) {
      const adapter = new PrismaPg({
        connectionString: process.env.DATABASE_URL,
      } as any);
      this.prisma = new PrismaClient({ adapter });
    }
    return this.prisma;
  }

  static async getAuthToken(app: INestApplication, email: string, password = 'Password123!') {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password });

    return response.body.accessToken;
  }

  static async registerUser(app: INestApplication, email: string, password = 'Password123!', firstName = 'Test', lastName = 'User') {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password, firstName, lastName });
    
    return response.body.user;
  }

  static async promoteToAdmin(userId: string) {
    const prisma = this.getPrisma();
    await prisma.user.update({
      where: { id: userId },
      data: { role: Role.ADMIN },
    });
  }

  static async createCategory(prisma: PrismaClient, name: string, slug: string) {
    return await prisma.category.create({
      data: { name, slug },
    });
  }

  static async createProduct(prisma: PrismaClient, name: string, price: number, sku: string, categoryId: string) {
    return await prisma.product.create({
      data: {
        name,
        price,
        sku,
        categoryId,
        stock: 100,
      },
    });
  }
}
