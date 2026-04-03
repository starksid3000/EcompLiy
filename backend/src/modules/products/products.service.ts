/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Category, Prisma, Product, ProductImage } from '@prisma/client';
import { ProductResponseDto } from './dto/product-response.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  // Create product
  async create(
    createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: createProductDto.sku },
    });
    if (existingSku) {
      throw new ConflictException(
        `Product with SKU ${createProductDto.sku} already exist`,
      );
    }

    const product = await this.prisma.product.create({
      data: {
        ...createProductDto,
        price: new Prisma.Decimal(createProductDto.price),
      },
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
      },
    });

    await this.bumpCacheVersion();
    return this.formatProduct(product);
  }
  // Get all product
  async findAll(queryDto: QueryProductDto) {
    const timeLabel = `fetch_products_${Date.now()}`;
    console.time(timeLabel);

    const version = await this.getCacheVersion();
    const cacheKey = `products:v${version}:${JSON.stringify(queryDto)}`;

    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log(`\n[Redis] CACHE HIT for ${cacheKey}`);
      console.timeEnd(timeLabel);
      return cached;
    }

    console.log(`\n[Redis] CACHE MISS for ${cacheKey} -> Querying DB`);
    const { category, isActive, search, page = 1, limit = 10 } = queryDto;

    let result;

    if (search) {
      const formattedSearch = search.trim();

      const categoryFilter = category
        ? Prisma.sql`AND p."categoryId" = ${category}`
        : Prisma.empty;

      const activeFilter =
        isActive !== undefined
          ? Prisma.sql`AND p."isActive" = ${isActive}`
          : Prisma.empty;

      const rawProducts = await this.prisma.$queryRaw<any[]>`
      SELECT p.*, c.name as category_name
      FROM products p
      JOIN category c ON p."categoryId" = c.id
      WHERE 
        (to_tsvector('english', p.name || ' ' || coalesce(p.description, '')) @@ plainto_tsquery('english', ${formattedSearch})
        OR similarity(p.name, ${formattedSearch}) > 0.15
        OR similarity(coalesce(p.description, ''), ${formattedSearch}) > 0.15)
        ${categoryFilter}
        ${activeFilter}
    `;

      const total = rawProducts.length;
      const paginated = rawProducts.slice((page - 1) * limit, page * limit);

      result = {
        data: paginated.map((p) => ({
          ...p,
          price: Number(p.price),
          category: p.category_name,
        })),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } else {
      const where: Prisma.ProductWhereInput = {};
      if (category) where.categoryId = category;
      if (isActive !== undefined) where.isActive = isActive;

      const total = await this.prisma.product.count({ where });

      const products = await this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      });

      result = {
        data: products.map((product) => this.formatProduct(product)),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    await this.cacheManager.set(cacheKey, result, 60); // Cache for 60 seconds
    console.timeEnd(timeLabel);

    return result;
  }

  // Get search suggestions
  async getSuggestions(query: string) {
    const timeLabel = `fetch_suggestions_${Date.now()}`;
    console.time(timeLabel);

    const cacheKey = `suggestions:${query.toLowerCase()}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log(`\n[Redis] CACHE HIT for ${cacheKey}`);
      console.timeEnd(timeLabel);
      return cached;
    }

    console.log(`\n[Redis] CACHE MISS for ${cacheKey} -> Querying DB`);
    const formattedSearch = query.trim();

    const rawSuggestions = await this.prisma.$queryRaw<any[]>`
      SELECT p.id, p.name, p."imageUrl"
      FROM products p
      WHERE 
        p."isActive" = true AND
        (to_tsvector('english', p.name) @@ plainto_tsquery('english', ${formattedSearch})
        OR similarity(p.name, ${formattedSearch}) > 0.1)
      ORDER BY 
        ts_rank(to_tsvector('english', p.name), plainto_tsquery('english', ${formattedSearch})) + 
        similarity(p.name, ${formattedSearch}) DESC
      LIMIT 5
    `;

    await this.cacheManager.set(cacheKey, rawSuggestions, 3600000); // High TTL for suggestions
    console.timeEnd(timeLabel);

    return rawSuggestions;
  }

  // Get product by id
  async findOne(id: string): Promise<ProductResponseDto> {
    const cacheKey = `product:${id}`;
    const cached = await this.cacheManager.get<ProductResponseDto>(cacheKey);
    if (cached) {
      console.log(`\n[Redis] CACHE HIT for ${cacheKey}`);
      return cached;
    }

    console.log(`\n[Redis] CACHE MISS for ${cacheKey} -> Querying DB`);
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const formatted = this.formatProduct(product);
    await this.cacheManager.set(cacheKey, formatted, 60); // Cache for 60 seconds
    return formatted;
  }

  // Update product
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new NotFoundException('Product not found');
    }

    if (updateProductDto.sku && updateProductDto.sku !== existingProduct.sku) {
      const skuTaken = await this.prisma.product.findUnique({
        where: { sku: updateProductDto.sku },
      });

      if (skuTaken) {
        throw new ConflictException(
          `Product with SKU ${updateProductDto.sku} already exists`,
        );
      }
    }

    const updateData: any = { ...updateProductDto };
    if (updateProductDto.price !== undefined) {
      updateData.price = new Prisma.Decimal(updateProductDto.price);
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
      },
    });
    await this.cacheManager.del(`product:${id}`);
    await this.bumpCacheVersion();
    return this.formatProduct(updatedProduct);
  }

  // Update product stock
  async updateStock(id: string, quantity: number): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const newStock = product.stock + quantity;

    if (newStock < 0) {
      throw new BadRequestException('Insufficient stock');
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: { stock: newStock },
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
      },
    });
    await this.cacheManager.del(`product:${id}`);
    await this.bumpCacheVersion();
    return this.formatProduct(updatedProduct);
  }

  // Remove a product
  async remove(id: string): Promise<{ message: string }> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: true,
        cartItems: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.orderItems.length > 0) {
      throw new BadRequestException(
        'Cannot delete product that is part of existing orders. Consider marking it as inactive only',
      );
    }

    await this.prisma.product.delete({
      where: { id },
    });
    await this.cacheManager.del(`product:${id}`);
    await this.bumpCacheVersion();
    return { message: 'Product deleted successfully' };
  }


  //Helpers
  private formatProduct(
    product: Product & { category: Category; images?: ProductImage[] },
  ): ProductResponseDto {
    return {
      ...product,
      price: Number(product.price),
      category: product.category.name,
      images: (product.images || []).map((img) => ({
        id: img.id,
        url: img.url,
        altText: img.altText,
        position: img.position,
      })),
    };
  }
  public async clearProductCache(id: string) {
    await this.cacheManager.del(`product:${id}`);
    await this.bumpCacheVersion();
  }

  private async getCacheVersion(): Promise<number> {
    return (await this.cacheManager.get<number>('product_version')) || 1;
  }
  public async bumpCacheVersion(): Promise<number> {
    return (await this.cacheManager.set('product_version', Date.now()));
  }
}