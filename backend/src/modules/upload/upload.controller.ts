import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Param,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UploadService } from './upload.service';

@ApiTags('Upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Profil fotoğrafı yükle' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadAvatar(file);
  }

  @Post('company/logo')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Firma logosu yükle' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  async uploadCompanyLogo(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadCompanyLogo(file);
  }

  @Post('company/cover')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Firma kapak fotoğrafı yükle' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  async uploadCompanyCover(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadCompanyCover(file);
  }

  @Post('review')
  @UseInterceptors(FilesInterceptor('files', 5))
  @ApiOperation({ summary: 'Yorum görselleri yükle (max 5)' })
  @ApiConsumes('multipart/form-data')
  async uploadReviewImages(@UploadedFiles() files: Express.Multer.File[]) {
    const results = await Promise.all(
      files.map((file) => this.uploadService.uploadReviewImage(file)),
    );
    return results;
  }
}
