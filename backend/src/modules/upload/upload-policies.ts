/**
 * Varlık tipine göre yükleme politikaları.
 * Her varlık tipi için farklı boyut limiti, çıktı boyutu, fit stratejisi ve
 * thumbnail ayarı tanımlanır. Tüm görseller WebP'ye dönüştürülür.
 */
export enum AssetType {
  AVATAR = 'avatar',
  LOGO = 'logo',
  COVER = 'cover',
  REVIEW = 'review',
}

export type ImageFit = 'cover' | 'inside';

export interface UploadPolicy {
  /** S3 klasörü */
  folder: string;
  /** Kabul edilen maksimum ham dosya boyutu (byte) */
  maxSize: number;
  /** Çıktı genişliği (px) */
  width: number;
  /** Çıktı yüksekliği (px) */
  height: number;
  /** Yeniden boyutlandırma stratejisi */
  fit: ImageFit;
  /** Thumbnail üretilecekse boyutları */
  thumbnail?: { width: number; height: number };
}

const MB = 1024 * 1024;

export const UPLOAD_POLICIES: Record<AssetType, UploadPolicy> = {
  [AssetType.AVATAR]: {
    folder: 'avatars',
    maxSize: 2 * MB,
    width: 400,
    height: 400,
    fit: 'cover',
    thumbnail: { width: 96, height: 96 },
  },
  [AssetType.LOGO]: {
    folder: 'logos',
    maxSize: 2 * MB,
    width: 512,
    height: 512,
    fit: 'inside',
    thumbnail: { width: 128, height: 128 },
  },
  [AssetType.COVER]: {
    folder: 'covers',
    maxSize: 5 * MB,
    width: 1600,
    height: 600,
    fit: 'cover',
  },
  [AssetType.REVIEW]: {
    folder: 'reviews',
    maxSize: 5 * MB,
    width: 1280,
    height: 1280,
    fit: 'inside',
    thumbnail: { width: 320, height: 320 },
  },
};

/** Yüklenebilecek ham MIME tipleri */
export const ALLOWED_IMAGE_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

/** sharp.metadata().format değerinden kabul edilenler */
export const ALLOWED_IMAGE_FORMATS = ['jpeg', 'png', 'webp', 'gif'];
