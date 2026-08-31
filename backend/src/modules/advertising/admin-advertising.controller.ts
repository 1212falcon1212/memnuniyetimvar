import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AdminAuthGuard } from '../admin/guards/admin-auth.guard';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { AdminRoles } from '../admin/decorators/admin-roles.decorator';
import { AdminRole } from '../users/entities/admin-user.entity';
import { AdvertisingService } from './advertising.service';
import { AdRequestStatus } from './entities/ad-request.entity';
import { CreateAdPackageDto, UpdateAdPackageDto, ProcessAdRequestDto } from './dto';

@ApiTags('Admin - Advertising')
@ApiBearerAuth()
@Controller('admin/advertising')
@UseGuards(AdminAuthGuard, AdminRolesGuard)
export class AdminAdvertisingController {
  constructor(private readonly advertisingService: AdvertisingService) {}

  // ── Packages ───────────────────────────────────────────────────

  @Get('packages')
  @ApiOperation({ summary: 'Tüm reklam paketleri' })
  listPackages() {
    return this.advertisingService.listAllPackages();
  }

  @Post('packages')
  @AdminRoles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reklam paketi oluştur' })
  createPackage(@Body() dto: CreateAdPackageDto) {
    return this.advertisingService.createPackage(dto);
  }

  @Patch('packages/:id')
  @AdminRoles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reklam paketi güncelle' })
  @ApiParam({ name: 'id', type: Number })
  updatePackage(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAdPackageDto) {
    return this.advertisingService.updatePackage(id, dto);
  }

  // ── Ad requests ────────────────────────────────────────────────

  @Get('requests')
  @ApiOperation({ summary: 'Reklam taleplerini listele' })
  @ApiQuery({ name: 'status', enum: AdRequestStatus, required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listRequests(
    @Query('status') status?: AdRequestStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.advertisingService.listRequests({
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Patch('requests/:id')
  @AdminRoles(AdminRole.ADMIN, AdminRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reklam talebini işle (onay/red/yayın/bütçe)' })
  @ApiParam({ name: 'id', type: String })
  processRequest(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ProcessAdRequestDto) {
    return this.advertisingService.processRequest(id, dto);
  }

  @Get('requests/:id/report')
  @ApiOperation({ summary: 'Reklam performans raporu' })
  @ApiParam({ name: 'id', type: String })
  getReport(@Param('id', ParseUUIDPipe) id: string) {
    return this.advertisingService.getReport(id);
  }
}
