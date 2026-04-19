import {
  Controller,
  Get,
  Param,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { Public } from '../../common/decorators';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Tüm kategorileri ağaç yapısında getir' })
  @ApiResponse({ status: 200, description: 'Kategori listesi (parent -> children)' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get('popular')
  @Public()
  @ApiOperation({ summary: 'En popüler 10 kategoriyi getir' })
  @ApiResponse({ status: 200, description: 'Popüler kategoriler (review_count sıralı)' })
  findPopular() {
    return this.categoriesService.findPopular();
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Slug ile kategori detayı getir' })
  @ApiParam({ name: 'slug', example: 'e-ticaret' })
  @ApiResponse({ status: 200, description: 'Kategori detayı (alt kategoriler ve firma sayısı dahil)' })
  @ApiResponse({ status: 404, description: 'Kategori bulunamadı' })
  findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  @Get(':slug/top')
  @Public()
  @ApiOperation({ summary: 'Kategorideki en iyi firmaları getir' })
  @ApiParam({ name: 'slug', example: 'e-ticaret' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Kategorideki en yüksek puanlı firmalar' })
  @ApiResponse({ status: 404, description: 'Kategori bulunamadı' })
  findTopByCategory(
    @Param('slug') slug: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.categoriesService.findTopByCategory(slug, limit);
  }
}
