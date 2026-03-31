import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { StorageService } from './storage.service';

@ApiTags('storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  // Admin only - upload an image to minio so it will generate public URL.
  // later passing the url as imageUrl when creating or updating a prodcut or category
  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB limit
      },
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowed.includes(file.mimetype)) {
          return cb(new BadRequestException('Only image files are allowed (jpeg, png, webp, gif)'), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Upload an image to MinIO (Admin Only)' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'folder',
    required: false,
    description: 'Subfolder prefix: "products" or "categories" (defaults to "products")',
    example: 'products',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to upload (max 5MB, jpeg/png/webp/gif)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', example: 'http://127.0.0.1:9000/products/products/abc-uuid.jpg' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'No file provided or invalid file type' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder = 'products',
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('No file provided. Send the image as multipart/form-data with field name "file".');
    }

    const url = await this.storageService.uploadFile(file, folder);
    return { url };
  }
}