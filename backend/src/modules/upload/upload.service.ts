import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

export interface UploadResult {
  key: string;
  url: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly endpoint: string;

  private static readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ];
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

  async uploadImage(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadResult> {
    this.validateImage(file);

    const ext = path.extname(file.originalname) || '.jpg';
    const key = `${folder}/${uuidv4()}${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const url = `${this.endpoint}/${this.bucket}/${key}`;
    this.logger.log(`Dosya yuklendi: ${key}`);

    return { key, url };
  }

  async uploadCompanyLogo(file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadImage(file, 'logos');
  }

  async uploadCompanyCover(file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadImage(file, 'covers');
  }

  async uploadReviewImage(file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadImage(file, 'reviews');
  }

  async uploadAvatar(file: Express.Multer.File): Promise<UploadResult> {
    return this.uploadImage(file, 'avatars');
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
    this.logger.log(`Dosya silindi: ${key}`);
  }

  private validateImage(file: Express.Multer.File): void {
    if (!UploadService.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException({
        code: 'INVALID_FILE_TYPE',
        message: 'Sadece JPEG, PNG, WebP ve GIF dosyaları yüklenebilir',
      });
    }

    if (file.size > UploadService.MAX_FILE_SIZE) {
      throw new BadRequestException({
        code: 'FILE_TOO_LARGE',
        message: 'Dosya boyutu en fazla 5MB olabilir',
      });
    }
  }
}
