import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { UploadService } from './upload.service';
import { AssetType } from './upload-policies';

async function makePng(width = 800, height = 800): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 10, g: 120, b: 80 } },
  })
    .png()
    .toBuffer();
}

function asFile(buffer: Buffer, mimetype = 'image/png', originalname = 'test.png'): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname,
    encoding: '7bit',
    mimetype,
    size: buffer.length,
    buffer,
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
  };
}

describe('UploadService (Faz 7)', () => {
  let service: UploadService;
  let sendSpy: jest.Mock;

  const config = {
    get: jest.fn((key: string, def?: unknown) => {
      const map: Record<string, unknown> = {
        's3.endpoint': 'http://localhost:9002',
        's3.bucket': 'memnuniyetimvar',
      };
      return key in map ? map[key] : def;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadService, { provide: ConfigService, useValue: config }],
    }).compile();
    service = module.get(UploadService);
    sendSpy = jest.fn().mockResolvedValue({});
    (service as any).s3 = { send: sendSpy };
  });

  describe('getPolicy', () => {
    it('her varlık tipi için politika döner', () => {
      expect(service.getPolicy(AssetType.AVATAR).folder).toBe('avatars');
      expect(service.getPolicy(AssetType.LOGO).folder).toBe('logos');
      expect(service.getPolicy(AssetType.COVER).folder).toBe('covers');
      expect(service.getPolicy(AssetType.REVIEW).folder).toBe('reviews');
    });

    it('avatar limiti 2MB, review limiti 5MB', () => {
      expect(service.getPolicy(AssetType.AVATAR).maxSize).toBe(2 * 1024 * 1024);
      expect(service.getPolicy(AssetType.REVIEW).maxSize).toBe(5 * 1024 * 1024);
    });

    it('cover thumbnail üretmez, avatar üretir', () => {
      expect(service.getPolicy(AssetType.COVER).thumbnail).toBeUndefined();
      expect(service.getPolicy(AssetType.AVATAR).thumbnail).toBeDefined();
    });
  });

  describe('validation', () => {
    it('dosya yoksa FILE_REQUIRED fırlatır', async () => {
      await expect(service.uploadAvatar(undefined as any)).rejects.toThrow(BadRequestException);
    });

    it('izinsiz MIME tipini reddeder', async () => {
      const file = asFile(Buffer.from('hello'), 'application/pdf', 'x.pdf');
      await expect(service.uploadAvatar(file)).rejects.toMatchObject({
        response: { code: 'INVALID_FILE_TYPE' },
      });
    });

    it('politika boyutunu aşan dosyayı reddeder (avatar > 2MB)', async () => {
      const buffer = Buffer.alloc(2 * 1024 * 1024 + 1, 1);
      const file = asFile(buffer, 'image/png');
      await expect(service.uploadAvatar(file)).rejects.toMatchObject({
        response: { code: 'FILE_TOO_LARGE' },
      });
    });

    it('MIME görsel ama içerik görsel değilse reddeder (gizlenmiş dosya)', async () => {
      const file = asFile(Buffer.from('this is definitely not an image'), 'image/png');
      await expect(service.uploadReviewImage(file)).rejects.toMatchObject({
        response: { code: 'INVALID_IMAGE' },
      });
    });
  });

  describe('processing & upload', () => {
    it('avatarı WebP ana görsel + thumbnail olarak yükler', async () => {
      const file = asFile(await makePng(800, 800));
      const result = await service.uploadAvatar(file);

      expect(result.key).toMatch(/^avatars\/.*\.webp$/);
      expect(result.thumbnailKey).toMatch(/^avatars\/.*_thumb\.webp$/);
      expect(result.thumbnailUrl).toContain('memnuniyetimvar');
      // ana görsel + thumbnail = 2 PutObject çağrısı
      expect(sendSpy).toHaveBeenCalledTimes(2);
      // 400x400 cover politikası
      expect(result.width).toBe(400);
      expect(result.height).toBe(400);
    });

    it('cover için thumbnail üretmez (tek yükleme)', async () => {
      const file = asFile(await makePng(2000, 800));
      const result = await service.uploadCompanyCover(file);

      expect(result.thumbnailKey).toBeUndefined();
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(result.key).toMatch(/^covers\/.*\.webp$/);
    });

    it('yüklenen içerik gerçekten WebP formatında', async () => {
      const file = asFile(await makePng(600, 600));
      await service.uploadReviewImage(file);

      const putArg = sendSpy.mock.calls[0][0];
      const body: Buffer = putArg.input.Body;
      const meta = await sharp(body).metadata();
      expect(meta.format).toBe('webp');
      expect(putArg.input.ContentType).toBe('image/webp');
    });
  });
});
