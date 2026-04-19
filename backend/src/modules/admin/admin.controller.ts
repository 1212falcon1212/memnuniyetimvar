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
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';

import { AdminService } from './admin.service';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminUser } from '../users/entities/admin-user.entity';
import { ReviewStatus } from '../reviews/entities/review.entity';
import { CompanyStatus, Company } from '../companies/entities/company.entity';
import { ClaimStatus } from '../companies/entities/company-claim.entity';
import { ReportStatus } from '../reports/entities/report.entity';
import { UserStatus } from '../users/entities/user.entity';
import { Category } from '../categories/entities/category.entity';

interface AdminRequest extends Request {
  admin: AdminUser;
}

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Auth ───────────────────────────────────────────────────────

  @Post('auth/login')
  @ApiOperation({ summary: 'Admin login' })
  login(@Body() dto: AdminLoginDto) {
    return this.adminService.adminLogin(dto);
  }

  // ── Dashboard ──────────────────────────────────────────────────

  @Get('dashboard')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  // ── Reviews ────────────────────────────────────────────────────

  @Get('reviews')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List reviews with optional status filter' })
  @ApiQuery({ name: 'status', enum: ReviewStatus, required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getReviews(
    @Query('status') status?: ReviewStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getReviews({
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Patch('reviews/:id/approve')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a review' })
  @ApiParam({ name: 'id', type: String })
  approveReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AdminRequest,
  ) {
    return this.adminService.approveReview(id, req.admin.id);
  }

  @Patch('reviews/:id/reject')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a review' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ schema: { properties: { reason: { type: 'string' } } } })
  rejectReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string,
    @Req() req: AdminRequest,
  ) {
    return this.adminService.rejectReview(id, req.admin.id, reason);
  }

  @Patch('reviews/:id/feature')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle review featured status' })
  @ApiParam({ name: 'id', type: String })
  featureReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AdminRequest,
  ) {
    return this.adminService.featureReview(id, req.admin.id);
  }

  @Delete('reviews/:id')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review' })
  @ApiParam({ name: 'id', type: String })
  deleteReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AdminRequest,
  ) {
    return this.adminService.deleteReview(id, req.admin.id);
  }

  // ── Companies ──────────────────────────────────────────────────

  @Get('companies')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List companies with optional status filter' })
  @ApiQuery({ name: 'status', enum: CompanyStatus, required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getCompanies(
    @Query('status') status?: CompanyStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getCompanies({
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('companies')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new company' })
  createCompany(@Body() dto: Partial<Company>) {
    return this.adminService.createCompany(dto);
  }

  @Patch('companies/:id')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a company' })
  @ApiParam({ name: 'id', type: String })
  updateCompany(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<Company>,
  ) {
    return this.adminService.updateCompany(id, dto);
  }

  @Delete('companies/:id')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a company' })
  @ApiParam({ name: 'id', type: String })
  deleteCompany(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AdminRequest,
  ) {
    return this.adminService.deleteCompany(id, req.admin.id);
  }

  // ── Claims ─────────────────────────────────────────────────────

  @Get('companies/claims')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List company claims' })
  @ApiQuery({ name: 'status', enum: ClaimStatus, required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getClaims(
    @Query('status') status?: ClaimStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getClaims({
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Patch('companies/claims/:id')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process a company claim (approve/reject)' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({
    schema: {
      properties: {
        status: { type: 'string', enum: ['approved', 'rejected'] },
        adminNote: { type: 'string', nullable: true },
      },
    },
  })
  processClaim(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: ClaimStatus,
    @Body('adminNote') adminNote: string | null,
    @Req() req: AdminRequest,
  ) {
    return this.adminService.processClaim(id, status, adminNote, req.admin.id);
  }

  // ── Users ──────────────────────────────────────────────────────

  @Get('users')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List users' })
  @ApiQuery({ name: 'status', enum: UserStatus, required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getUsers(
    @Query('status') status?: UserStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getUsers({
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Patch('users/:id/ban')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ban a user' })
  @ApiParam({ name: 'id', type: String })
  banUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AdminRequest,
  ) {
    return this.adminService.banUser(id, req.admin.id);
  }

  @Patch('users/:id/unban')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unban a user' })
  @ApiParam({ name: 'id', type: String })
  unbanUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AdminRequest,
  ) {
    return this.adminService.unbanUser(id, req.admin.id);
  }

  // ── Reports ────────────────────────────────────────────────────

  @Get('reports')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List reports with optional status filter' })
  @ApiQuery({ name: 'status', enum: ReportStatus, required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getReports(
    @Query('status') status?: ReportStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getReports({
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Patch('reports/:id')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process a report (reviewed/dismissed)' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({
    schema: {
      properties: {
        status: { type: 'string', enum: ['reviewed', 'dismissed'] },
      },
    },
  })
  processReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: ReportStatus,
    @Req() req: AdminRequest,
  ) {
    return this.adminService.processReport(id, status, req.admin.id);
  }

  // ── Categories ─────────────────────────────────────────────────

  @Get('categories')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all categories as tree' })
  getCategories() {
    return this.adminService.getCategories();
  }

  @Post('categories')
  @UseGuards(AdminAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or update a category' })
  createOrUpdateCategory(@Body() dto: Partial<Category>) {
    return this.adminService.createOrUpdateCategory(dto);
  }
}
