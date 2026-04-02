/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Role } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CategoryResponseDto } from './dto/category-response.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';


@ApiTags("Categories")
@Controller('category')
export class CategoryController {
    constructor ( private readonly categoryService: CategoryService) {}

  // Create a new category
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new category' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({ status: 201, description: 'Category created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return await this.categoryService.create(createCategoryDto);
  }

    //get all categories
    @Get()
    @UseInterceptors(CacheInterceptor)
    @CacheTTL(60000)
    @ApiOperation({ summary:'Get all Categories'})
    @ApiResponse({
        status:200,
        description: 'List of categories retrieved successfully',
        schema:{
           type: 'object',
           properties: {
            data:{
                type: 'array',
                items: { $ref: '#/components/schemas/CategoryResponseDto'}
            },
            meta:{
                type: 'object',
                properties: {
                    total: {type: 'number'},
                    page: {type: 'number'},
                    limit: {type: 'number'},
                    totalPages: {type:'number'}
                }
            }
           } 
        }
    })
    async findAll(@Query() queryDto: QueryCategoryDto ){
        return await this.categoryService.findAll(queryDto);
    }

    //Get category by Id
    @Get(":id")
    @UseInterceptors(CacheInterceptor)
    @CacheTTL(60000)
    @ApiOperation({summary: 'Get Category by Id'})
    @ApiResponse({
        status: 200,
        description: 'Category detials',
        type: CategoryResponseDto,
    })
    @ApiResponse({
        status:404,
        description: 'Category not found',
    })
    async findOne(@Param("id") id: string): Promise<CategoryResponseDto>{
        return await this.categoryService.findOne(id);
    }

    //Get category by slug
    @Get('slug/:slug')
    @UseInterceptors(CacheInterceptor)
    @CacheTTL(60000)
    @ApiOperation({summary: 'Get Category by slug'})
    @ApiResponse({
        status: 200,
        description: 'Category detials slug',
        type: CategoryResponseDto,
    })
    @ApiResponse({
        status:404,
        description: 'Category not found',
    })
    async findBySlug(@Param('slug') slug:string): Promise<CategoryResponseDto>{
        return await this.categoryService.findBySlug(slug);
    }

    //Update category
    @Patch(':id')
    @UseGuards(JwtAuthGuard,RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({summary :"Update category admin only"})
    @ApiBody({
        type: UpdateCategoryDto,
    })
    @ApiResponse({
        status: 200,
        description: 'Category updated successfully',
        type: CreateCategoryDto,
    })
    @ApiResponse({
        status:404,
        description: 'Category not found',
    })    
    @ApiResponse({
        status:409,
        description: 'Category slug already',
    })
    async update(@Param('id') id:string,@Body() updateCategoryDto: UpdateCategoryDto): Promise<CategoryResponseDto>{
        return await this.categoryService.update(id, updateCategoryDto);
    }

    //delete category admin only
    @Delete(':id')
    @UseGuards(JwtAuthGuard,RolesGuard)
    @Roles(Role.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary :"Delete category admin only"})
    @ApiBody({
        type: UpdateCategoryDto,
    })
    @ApiResponse({
        status: 200,
        description: 'Category Deleted successfully',
        type: CreateCategoryDto,
    })
    @ApiResponse({
        status:400,
        description: 'Can not delete category with products',
    })    
    async remove(@Param('id') id:string): Promise<{message : string}>{
        return await this.categoryService.remove(id);
    }

}
