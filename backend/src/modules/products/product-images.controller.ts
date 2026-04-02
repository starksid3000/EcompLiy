/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "src/prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { ProductsService } from "./products.service";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { Role } from "@prisma/client";
import { FileInterceptor } from "@nestjs/platform-express";

@ApiTags('product-images')
@Controller('products/:productId/images')
export class ProductImagesController{
    constructor(
        private readonly primsa : PrismaService,
        private readonly storageService : StorageService,
        private readonly productsService : ProductsService,
    ){}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth('JWT-auth')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowed.includes(file.mimetype)) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
    @ApiOperation({summary:"Upload a gallary image for a product (ADMIN Only)"})
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema:{
            type:'object',
            properties:{
                file : {type:'string', format:'binary'},
            },
            required: ['file'],
        }
    })
    async upload( @Param('productId') productId:string, @UploadedFile() file:Express.Multer.File){
        //check file is uploaded or not
        if(!file){
            throw new BadRequestException("No file provided");
        }
        //verify product exist or not
        const product = await this.primsa.product.findUnique({ where: {id:productId}});
        if(!product) {
            throw new NotFoundException("Product not found")
        }

        //upload to MinIO

        const url = await this.storageService.uploadFile(file, 'products');

        const maxPos = await this.primsa.productImage.aggregate({
            where:{productId},
            _max: {position: true},
        });
        const position = (maxPos._max.position ?? -1 ) +1;

        //save to DB
        const image = await this.primsa.productImage.create({
            data:{
                url,
                productId,
                position,
            }
        });

        await this.productsService.clearProductCache(productId);
        return image;
    }

    //get all the images of the product
    @Get()
    @ApiOperation({ summary:'Get all gallery images for a product'})
    async list(@Param('productId') productId:string){
        const product = await this.primsa.product.findUnique({where: {id:productId}})

        if(!product) {
            throw new NotFoundException("Product not found");
        }
        return this.primsa.productImage.findMany({
            where:{productId},
            orderBy:{position: 'asc'},
        })
    }

    @Delete(":imageId")
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth("JWT-auth")
    @ApiOperation({summary:'Delete a gallary image (ADMIN Only)'})
    async remove(@Param('productId') productId:string, @Param('imageId') imageId:string){
        const image = await this.primsa.productImage.findFirst({
            where:{id:imageId, productId},
        })
        if(!image){
            throw new NotFoundException("image not found")
        }

        //delete from minIO as well

        await this.storageService.deleteFile(image.url);

        //delete from db

        await this.primsa.productImage.delete({
            where:{id: imageId}
        });

        await this.productsService.clearProductCache(productId);
        return { message : "Image deleted successfully"}
    }

    //reorder images
    @Patch('reorder')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth("JWT-auth")
    @ApiOperation({summary: "reorder / change the order of image"})
    @ApiBody({
        schema:{
            type:"object",
            properties:{
                order:{
                    type:"array",
                    items:{type:'string'},
                    description:"Array of image Ids in desired order",
                }
            }
        }
    })
    async reorder(@Param('productId') productId:string, @Body('order') order:string[]){
        if(!order || !Array.isArray(order)){
            throw new BadRequestException("order must be an array og image Ids")
        }
        
        //update each image's position
        await Promise.all(
            order.map((imageId, index) => this.primsa.productImage.updateMany({
                where:{id:imageId, productId},
                data: {position: index},
            }))
        );

        await this.productsService.clearProductCache(productId);

        return this.primsa.productImage.findMany({
            where:{productId},
            orderBy: {position:"asc"},
        })
    }
}