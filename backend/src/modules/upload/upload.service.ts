import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import {
  AssetType,
  UploadPolicy,
  UPLOAD_POLICIES,
  ALLOWED_IMAGE_MIME,
  ALLOWED_IMAGE_FORMATS,
} from './upload-policies';

export interface UploadResult {
  key: string;
  url: string;
  thumbnailKey?: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  size: number;
}

interface ProcessedImage {
  main: Buffer;
  thumbnail?: Buffer;
  width: number;
  height: number;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.endpoint = this.configService.get<string>('s3.endpoint', 'http://localhost:9002');
    this.bucket = this.configService.get<string>('s3.bucket', 'memnuniyetimvar');

    this.s3 = new S3Client({
      endpoint: this.endpoint,
      region: this.configService.get<string>('s3.region', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.get<string>('s3.accessKeyId', ''),
        secretAccessKey: this.configService.get<string>('s3.secretAccessKey', ''),
      },
      forcePathStyle: this.configService.get<boolean>('s3.forcePathStyle', true),
    });
  }

  getPolicy(assetType: AssetType): UploadPolicy {
    return UPLOAD_POLICIES[assetType];
  }

  async uploadImage(file: Express.Multer.File, assetType: AssetType): Promise<UploadResult> {
    const policy = this.getPolicy(assetType);

    this.validateImage(file, policy);
    await this.assertDecodableImage(file.buffer);

    const processed = await this.processImage(file.buffer, policy);

    const id = randomUUID();
    const key = `${policy.folder}/${id}.webp`;
    await this.putObject(key, processed.main, 'image/webp');

    let thumbnailKey: string | undefined;
    let thumbnailUrl: string | undefined;
    if (processed.thumbnail) {
      thumbnailKey = `${policy.folder}/${id}_thumb.webp`;
      await this.putObject(thumbnailKey, processed.thumbnail, 'image/webp');
      thumbnailUrl = this.publicUrl(thumbnailKey);
    }

    this.logger.log(`Dosya yuklendi: ${key} (${assetType})`);

    return {
      key,
      url: this.publicUrl(key),
      thumbnailKey,
      thumbnailUrl,
      width: processed.width,
      height: processed.height,
      size: processed.main.length,
    };
  }

  uploadAvatar(file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadImage(file, AssetType.AVATAR);
  }

  uploadCompanyLogo(file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadImage(file, AssetType.LOGO);
  }

  uploadCompanyCover(file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadImage(file, AssetType.COVER);
  }

  uploadReviewImage(file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadImage(file, AssetType.REVIEW);
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    this.logger.log(`Dosya silindi: ${key}`);
  }

  // ── Private ───────────────────────────────────────────────────

  private publicUrl(key: string): string {
    return `${this.endpoint}/${this.bucket}/${key}`;
  }

  private async putObject(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  /** İçerik bağımsız ilk kontrol: dosya var mı, MIME ve boyut politikaya uygun mu */
  private validateImage(file: Express.Multer.File | undefined, policy: UploadPolicy): void {
    if (!file || !file.buffer || file.size === 0) {
      throw new BadRequestException({
        code: 'FILE_REQUIRED',
        message: 'Yüklenecek bir dosya gönderilmedi',
      });
    }

    if (!ALLOWED_IMAGE_MIME.includes(file.mimetype)) {
      throw new BadRequestException({
        code: 'INVALID_FILE_TYPE',
        message: 'Sadece JPEG, PNG, WebP ve GIF dosyaları yüklenebilir',
      });
    }

    if (file.size > policy.maxSize) {
      const mb = Math.round(policy.maxSize / (1024 * 1024));
      throw new BadRequestException({
        code: 'FILE_TOO_LARGE',
        message: `Dosya boyutu en fazla ${mb}MB olabilir`,
      });
    }
  }

  /**
   * Güvenlik kontrolü: dosyanın gerçekten çözülebilir bir görsel olduğunu ve
   * uzantı/MIME ile gizlenmiş zararlı içerik olmadığını doğrular.
   * sharp gerçek format ve boyutları okur; okunamayan içerik reddedilir.
   */
  private async assertDecodableImage(buffer: Buffer): Promise<void> {
    let metadata: sharp.Metadata;
    try {
      metadata = await sharp(buffer).metadata();
    } catch {
      throw new BadRequestException({
        code: 'INVALID_IMAGE',
        message: 'Dosya geçerli bir görsel olarak çözümlenemedi',
      });
    }

    if (!metadata.format || !ALLOWED_IMAGE_FORMATS.includes(metadata.format)) {
      throw new BadRequestException({
        code: 'INVALID_FILE_TYPE',
        message: 'Dosya içeriği desteklenen bir görsel formatı değil',
      });
    }

    if (!metadata.width || !metadata.height) {
      throw new BadRequestException({
        code: 'INVALID_IMAGE',
        message: 'Görsel boyutları okunamadı',
      });
    }
  }

  /** Görseli WebP'ye dönüştürür ve politika gerektiriyorsa thumbnail üretir */
  private async processImage(buffer: Buffer, policy: UploadPolicy): Promise<ProcessedImage> {
    const { data, info } = await sharp(buffer)
      .rotate() // EXIF orientation düzelt
      .resize(policy.width, policy.height, { fit: policy.fit, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });

    let thumbnail: Buffer | undefined;
    if (policy.thumbnail) {
      thumbnail = await sharp(buffer)
        .rotate()
        .resize(policy.thumbnail.width, policy.thumbnail.height, { fit: 'cover' })
        .webp({ quality: 75 })
        .toBuffer();
    }

    return { main: data, thumbnail, width: info.width, height: info.height };
  }
}
