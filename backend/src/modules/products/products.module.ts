import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { StorageService } from '../storage/storage.service';
import { ProductImagesController } from './product-images.controller';

@Module({
  imports : [StorageService],
  providers: [ProductsService],
  controllers: [ProductsController, ProductImagesController],
})
export class ProductsModule {}
