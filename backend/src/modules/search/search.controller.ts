import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { SearchService } from './search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Genel arama (firma + yorum)' })
  @ApiQuery({ name: 'q', required: true, description: 'Arama sorgusu' })
  @ApiQuery({ name: 'limit', required: false, description: 'Sonuc limiti', type: Number })
  async search(
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.searchAll(query, limit || 10);
  }

  @Get('companies')
  @Public()
  @ApiOperation({ summary: 'Firma arama' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async searchCompanies(
    @Query('q') query: string,
    @Query('city') city?: string,
    @Query('category') category?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const filters: string[] = ['status = "active"'];
    if (city) filters.push(`city = "${city}"`);
    if (category) filters.push(`categoryName = "${category}"`);

    return this.searchService.searchCompanies(query, {
      filter: filters.join(' AND '),
      sort: ['memnuniyetScore:desc'],
      limit: limit || 20,
      offset: offset || 0,
    });
  }

  @Get('reviews')
  @Public()
  @ApiOperation({ summary: 'Yorum arama' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async searchReviews(
    @Query('q') query: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.searchService.searchReviews(query, {
      filter: 'status = "published"',
      limit: limit || 20,
      offset: offset || 0,
    });
  }
}
