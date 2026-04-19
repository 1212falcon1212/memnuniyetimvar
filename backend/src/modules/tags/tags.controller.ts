import {
  Controller,
  Get,
  Param,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { Public } from '../../common/decorators';

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Populer etiketler' })
  @ApiQuery({ name: 'limit', required: false, description: 'Sonuc limiti' })
  @ApiResponse({ status: 200, description: 'Etiket listesi' })
  findAll(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.tagsService.findAll(limit);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Etikete gore yorumlar' })
  @ApiParam({ name: 'slug', description: 'Etiket slug' })
  @ApiQuery({ name: 'page', required: false, description: 'Sayfa numarasi' })
  @ApiQuery({ name: 'limit', required: false, description: 'Sonuc limiti' })
  @ApiResponse({ status: 200, description: 'Etikete ait yorumlar' })
  @ApiResponse({ status: 404, description: 'Etiket bulunamadi' })
  findBySlug(
    @Param('slug') slug: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.tagsService.findBySlug(slug, page, limit);
  }
}
