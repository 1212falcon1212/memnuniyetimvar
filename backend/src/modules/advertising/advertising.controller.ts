import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators';
import { AdvertisingService } from './advertising.service';
import { InvitationsService } from './invitations.service';
import { CreateAdRequestDto, CreateInvitationDto } from './dto';

@ApiTags('Advertising')
@Controller('advertising')
@UseGuards(JwtAuthGuard)
export class AdvertisingController {
  constructor(
    private readonly advertisingService: AdvertisingService,
    private readonly invitationsService: InvitationsService,
  ) {}

  // ── Public ─────────────────────────────────────────────────────

  @Get('packages')
  @Public()
  @ApiOperation({ summary: 'Aktif reklam paketleri' })
  listPackages() {
    return this.advertisingService.listActivePackages();
  }

  @Get('sponsored')
  @Public()
  @ApiOperation({ summary: 'Sponsorlu firma vitrini' })
  sponsored(@Query('limit') limit?: string) {
    return this.advertisingService.getSponsoredCompanies(limit ? parseInt(limit, 10) : undefined);
  }

  @Post('requests/:id/impression')
  @Public()
  @ApiOperation({ summary: 'Sponsorlu içerik görüntülenme kaydı' })
  @ApiParam({ name: 'id', type: String })
  impression(@Param('id', ParseUUIDPipe) id: string) {
    return this.advertisingService.recordImpression(id);
  }

  @Post('requests/:id/click')
  @Public()
  @ApiOperation({ summary: 'Sponsorlu içerik tıklama kaydı' })
  @ApiParam({ name: 'id', type: String })
  click(@Param('id', ParseUUIDPipe) id: string) {
    return this.advertisingService.recordClick(id);
  }

  // ── Ad requests (owner) ────────────────────────────────────────

  @Post('requests')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reklam talebi oluştur' })
  createRequest(@CurrentUser('id') userId: string, @Body() dto: CreateAdRequestDto) {
    return this.advertisingService.createRequest(userId, dto);
  }

  @Get('requests/mine')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kendi reklam taleplerim' })
  myRequests(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.advertisingService.listMyRequests(
      userId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Patch('requests/:id/cancel')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reklam talebini iptal et' })
  @ApiParam({ name: 'id', type: String })
  cancelRequest(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.advertisingService.cancelRequest(userId, id);
  }

  // ── Review invitations (owner) ─────────────────────────────────

  @Post('invitations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Doğrulanmış müşteri yorum daveti oluştur' })
  createInvitation(@CurrentUser('id') userId: string, @Body() dto: CreateInvitationDto) {
    return this.invitationsService.create(userId, dto);
  }

  @Get('invitations/mine')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kendi davetlerim' })
  myInvitations(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.invitationsService.listMine(
      userId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Patch('invitations/:id/cancel')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Daveti iptal et' })
  @ApiParam({ name: 'id', type: String })
  cancelInvitation(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.invitationsService.cancel(userId, id);
  }

  // ── Invitation token validation (public) ───────────────────────

  @Get('invitations/token/:token')
  @Public()
  @ApiOperation({ summary: 'Davet token doğrulama (davet sayfası için)' })
  @ApiParam({ name: 'token', type: String })
  validateToken(@Param('token') token: string) {
    return this.invitationsService.getByToken(token);
  }
}
