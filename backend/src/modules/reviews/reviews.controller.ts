import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto } from './dto';
import { Public, CurrentUser } from '../../common/decorators';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Reviews')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // ── Static routes FIRST ─────────────────────────────────────

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yeni yorum olustur' })
  @ApiResponse({ status: 201, description: 'Yorum basariyla olusturuldu' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erisim' })
  @ApiResponse({ status: 404, description: 'Firma bulunamadi' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(userId, dto);
  }

  @Public()
  @Get('latest')
  @ApiOperation({ summary: 'Son yorumlar' })
  @ApiQuery({ name: 'limit', required: false, description: 'Sonuc limiti' })
  @ApiResponse({ status: 200, description: 'Son yorumlar listesi' })
  findLatest(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.reviewsService.findLatest(limit);
  }

  @Public()
  @Get('featured')
  @ApiOperation({ summary: 'One cikan yorumlar' })
  @ApiQuery({ name: 'limit', required: false, description: 'Sonuc limiti' })
  @ApiResponse({ status: 200, description: 'One cikan yorumlar listesi' })
  findFeatured(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.reviewsService.findFeatured(limit);
  }

  // ── Param routes AFTER static routes ────────────────────────

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Yorum detayi' })
  @ApiParam({ name: 'slug', description: 'Yorum slug' })
  @ApiResponse({ status: 200, description: 'Yorum detayi basariyla getirildi' })
  @ApiResponse({ status: 404, description: 'Yorum bulunamadi' })
  findBySlug(@Param('slug') slug: string) {
    return this.reviewsService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yorumu guncelle' })
  @ApiParam({ name: 'id', description: 'Yorum UUID' })
  @ApiResponse({ status: 200, description: 'Yorum basariyla guncellendi' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erisim' })
  @ApiResponse({ status: 403, description: 'Bu yorumu duzenleme yetkiniz yok' })
  @ApiResponse({ status: 404, description: 'Yorum bulunamadi' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(userId, id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yorumu sil' })
  @ApiParam({ name: 'id', description: 'Yorum UUID' })
  @ApiResponse({ status: 200, description: 'Yorum basariyla silindi' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erisim' })
  @ApiResponse({ status: 403, description: 'Bu yorumu silme yetkiniz yok' })
  @ApiResponse({ status: 404, description: 'Yorum bulunamadi' })
  remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reviewsService.remove(userId, id);
  }

  @Post(':id/helpful')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Faydali oyu ver' })
  @ApiParam({ name: 'id', description: 'Yorum UUID' })
  @ApiResponse({ status: 201, description: 'Faydali oyu basariyla eklendi' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erisim' })
  @ApiResponse({ status: 404, description: 'Yorum bulunamadi' })
  @ApiResponse({ status: 409, description: 'Zaten oy verilmis' })
  addHelpful(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reviewsService.addHelpful(userId, id);
  }

  @Delete(':id/helpful')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Faydali oyunu geri al' })
  @ApiParam({ name: 'id', description: 'Yorum UUID' })
  @ApiResponse({ status: 200, description: 'Faydali oyu basariyla kaldirildi' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erisim' })
  @ApiResponse({ status: 404, description: 'Yorum veya oy bulunamadi' })
  removeHelpful(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.reviewsService.removeHelpful(userId, id);
  }

  @Post(':id/report')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yorumu sikayet et' })
  @ApiParam({ name: 'id', description: 'Yorum UUID' })
  @ApiResponse({ status: 201, description: 'Sikayet basariyla olusturuldu' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erisim' })
  @ApiResponse({ status: 404, description: 'Yorum bulunamadi' })
  report(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @Body('description') description: string,
  ) {
    return this.reviewsService.report(userId, id, reason, description);
  }

  @Post(':id/images')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Yoruma resim ekle' })
  @ApiParam({ name: 'id', description: 'Yorum UUID' })
  @ApiResponse({ status: 201, description: 'Resimler basariyla eklendi' })
  @ApiResponse({ status: 400, description: 'Maksimum resim sayisi asildi' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erisim' })
  @ApiResponse({ status: 403, description: 'Bu yoruma resim ekleme yetkiniz yok' })
  @ApiResponse({ status: 404, description: 'Yorum bulunamadi' })
  addImages(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('imageUrls') imageUrls: string[],
  ) {
    return this.reviewsService.addImages(id, userId, imageUrls);
  }
}
