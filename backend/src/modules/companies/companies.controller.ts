import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import {
  CreateCompanyDto,
  CompanyFilterDto,
  ClaimCompanyDto,
} from './dto';
import { PaginationDto } from '../../common/dto';
import { Public } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Companies')
@Controller('companies')
@UseGuards(JwtAuthGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Firma listesi (filtreli, sayfalanmis)' })
  @ApiResponse({ status: 200, description: 'Firma listesi basariyla getirildi' })
  findAll(@Query() filter: CompanyFilterDto) {
    return this.companiesService.findAll(filter);
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Firma ara' })
  @ApiQuery({ name: 'q', required: true, description: 'Arama sorgusu' })
  @ApiQuery({ name: 'limit', required: false, description: 'Sonuc limiti' })
  @ApiResponse({ status: 200, description: 'Arama sonuclari' })
  search(
    @Query('q') query: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.companiesService.search(query, limit);
  }

  @Public()
  @Get('top')
  @ApiOperation({ summary: 'En iyi firmalar' })
  @ApiQuery({ name: 'limit', required: false, description: 'Sonuc limiti' })
  @ApiResponse({ status: 200, description: 'En iyi firmalar listesi' })
  findTop(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.companiesService.findTop(limit);
  }

  @Public()
  @Get('trending')
  @ApiOperation({ summary: 'Trend firmalar' })
  @ApiQuery({ name: 'limit', required: false, description: 'Sonuc limiti' })
  @ApiResponse({ status: 200, description: 'Trend firmalar listesi' })
  findTrending(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.companiesService.findTrending(limit);
  }

  @Public()
  @Get('by-category/:slug')
  @ApiOperation({ summary: 'Kategoriye gore firmalar' })
  @ApiParam({ name: 'slug', description: 'Kategori slug' })
  @ApiResponse({ status: 200, description: 'Kategorideki firmalar' })
  @ApiResponse({ status: 404, description: 'Kategori bulunamadi' })
  findByCategory(
    @Param('slug') slug: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.companiesService.findByCategory(slug, pagination);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Firma detayi' })
  @ApiParam({ name: 'slug', description: 'Firma slug' })
  @ApiResponse({ status: 200, description: 'Firma detayi basariyla getirildi' })
  @ApiResponse({ status: 404, description: 'Firma bulunamadi' })
  findBySlug(@Param('slug') slug: string) {
    return this.companiesService.findBySlug(slug);
  }

  @Public()
  @Get(':slug/reviews')
  @ApiOperation({ summary: 'Firma yorumlari' })
  @ApiParam({ name: 'slug', description: 'Firma slug' })
  @ApiResponse({ status: 200, description: 'Firma yorumlari listesi' })
  @ApiResponse({ status: 404, description: 'Firma bulunamadi' })
  findReviews(
    @Param('slug') slug: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.companiesService.findReviewsByCompany(slug, pagination);
  }

  @Public()
  @Get(':slug/stats')
  @ApiOperation({ summary: 'Firma istatistikleri' })
  @ApiParam({ name: 'slug', description: 'Firma slug' })
  @ApiResponse({ status: 200, description: 'Firma istatistikleri' })
  @ApiResponse({ status: 404, description: 'Firma bulunamadi' })
  getStats(@Param('slug') slug: string) {
    return this.companiesService.getStats(slug);
  }

  @Post('suggest')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yeni firma onerisi' })
  @ApiResponse({ status: 201, description: 'Firma onerisi olusturuldu' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erisim' })
  suggest(@Body() dto: CreateCompanyDto) {
    return this.companiesService.suggest(dto);
  }

  @Post(':id/claim')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Firma sahiplik talebi' })
  @ApiParam({ name: 'id', description: 'Firma UUID' })
  @ApiResponse({ status: 201, description: 'Sahiplik talebi olusturuldu' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erisim' })
  @ApiResponse({ status: 404, description: 'Firma bulunamadi' })
  claimCompany(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ClaimCompanyDto,
  ) {
    return this.companiesService.claimCompany(id, dto);
  }
}
