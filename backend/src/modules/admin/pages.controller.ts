import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { AdminService } from './admin.service';

@ApiTags('Pages')
@Controller('pages')
export class PagesController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'List published static pages' })
  getPublishedPages() {
    return this.adminService.getPublishedPages();
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get published static page by slug' })
  getPage(@Param('slug') slug: string) {
    return this.adminService.getPublishedPage(slug);
  }
}
