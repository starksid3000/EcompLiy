/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { mockCacheManager } from 'src/test/mocks/cache.mock';
import { PrismaService } from 'src/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { mockPrismaService } from 'src/test/mocks/prisma.mock';

describe('UsersService', () => {
  let service: UsersService;
  let primsa: typeof mockPrismaService;
  let cache: typeof mockCacheManager;
  const mockUser = {
    id:'userId-1',
    email:'test@example.com',
    firstName:"siddharth",
    lastName:"Dave",
    createdAt : Date.now(),
    updatedAt:Date.now(),
  }
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {provide: PrismaService, useValue: mockPrismaService},
        {provide: CACHE_MANAGER, useValue: mockPrismaService},
      ],

    }).compile();

    service = module.get<UsersService>(UsersService);
    primsa = module.get(PrismaService);
    cache = module.get(CACHE_MANAGER);
  });
  describe('findOne', () =>{
    cache.get.mockResolvedValue(mockUser);
    
  }) 
});
