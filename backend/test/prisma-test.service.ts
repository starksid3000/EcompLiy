import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

export class PrismaTestService {
  private static prisma: PrismaClient;

  public static getClient() {
    if (!this.prisma) {
      const adapter = new PrismaPg({
        connectionString: process.env.DATABASE_URL,
      } as any);
      this.prisma = new PrismaClient({ adapter });
    }
    return this.prisma;
  }

  static async ensureExtensions() {
    const prisma = this.getClient();
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
  }

  static async cleanDb() {
    try {
      const prisma = this.getClient();
      await this.ensureExtensions();
      const tableNames = await prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename FROM pg_tables 
        WHERE schemaname='public' AND tablename != '_prisma_migrations';
      `;

      if (tableNames.length === 0) return;

      const tables = tableNames
        .map(({ tablename }) => '"' + tablename + '"')
        .join(', ');

      await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    } catch (error) {
      console.error('Failed to clean database:', error);
    }
  }

  static async disconnect() {
    await this.prisma.$disconnect();
  }
}
