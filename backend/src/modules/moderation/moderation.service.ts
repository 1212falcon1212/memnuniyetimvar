import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { Review, ReviewStatus } from '../reviews/entities/review.entity';
import { User } from '../users/entities/user.entity';
import { Notification } from '../notifications/entities/notification.entity';

export interface SpamCheckResult {
  score: number;
  flags: string[];
}

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);
  private readonly redis: Redis;

  private readonly forbiddenWords = [
    'casino', 'bahis', 'viagra', 'telegram', 'porn', 'xxx',
    'kitap', 'kumar', 'bet', 'slot', 'rulet',
  ];

  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly configService: ConfigService,
  ) {
    this.redis = new Redis({
      host: this.configService.get<string>('redis.host', 'localhost'),
      port: this.configService.get<number>('redis.port', 6379),
    });
  }

  async calculateSpamScore(reviewId: string): Promise<SpamCheckResult> {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) return { score: 0, flags: [] };

    const user = await this.userRepo.findOne({ where: { id: review.userId } });
    let score = 0;
    const flags: string[] = [];

    const text = `${review.title} ${review.content}`.toLowerCase();

    const matchedForbidden = this.forbiddenWords.filter((w) => text.includes(w));
    if (matchedForbidden.length > 0) {
      score += 40;
      flags.push(`forbidden_words:${matchedForbidden.join(',')}`);
    }

    const linkCount = (text.match(/https?:\/\//g) || []).length;
    if (linkCount > 2) {
      score += 25;
      flags.push(`excessive_links:${linkCount}`);
    }

    if (review.content.length < 20) {
      score += 15;
      flags.push('too_short');
    }

    if (review.content.length > 5000) {
      score += 10;
      flags.push('too_long');
    }

    const recentCount = await this.getRecentReviewCount(review.userId);
    if (recentCount >= 4) {
      score += 20;
      flags.push(`high_frequency:${recentCount}`);
    }

    if (user) {
      if (!user.is_phone_verified && !user.is_email_verified) {
        score += 20;
        flags.push('unverified_account');
      }

      const accountAgeHours = (Date.now() - user.created_at.getTime()) / 3600000;
      if (accountAgeHours < 1) {
        score += 15;
        flags.push('brand_new_account');
      }
    }

    const duplicateFlag = await this.checkDuplicateContent(review.userId, review.content);
    if (duplicateFlag) {
      score += 30;
      flags.push('duplicate_content');
    }

    score = Math.min(score, 100);

    return { score, flags };
  }

  async markReviewIfNeeded(reviewId: string): Promise<void> {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) return;

    const result = await this.calculateSpamScore(reviewId);

    if (result.score > 0) {
      try {
        await this.reviewRepo.update(reviewId, { spamScore: result.score } as Partial<Review>);
      } catch {
        this.logger.warn(`spam_score kolonu guncellenemedi: ${reviewId}`);
      }
    }

    if (result.score >= 50) {
      this.logger.warn(`Supheli yorum tespit edildi: ${reviewId}, skor: ${result.score}, bayraklar: ${result.flags.join(',')}`);

      try {
        await this.reviewRepo.update(reviewId, {
          status: ReviewStatus.PENDING,
          moderationNote: `Otomatik isaret: ${result.flags.join(', ')}`,
        } as Partial<Review>);
      } catch {
        this.logger.warn(`Yorum durumu guncellenemedi: ${reviewId}`);
      }

      try {
        await this.notificationRepo.save(this.notificationRepo.create({
          user_id: review.userId,
          type: 'review_flagged',
          title: 'Yorumunuz incelemeye alındı',
          message: 'Yorumunuz otomatik denetim sistemi tarafından incelemeye alındı. Editörlerimiz en kısa sürede değerlendirecektir.',
          data: { reviewId, spamScore: result.score, flags: result.flags },
        }));
      } catch (err) {
        this.logger.warn(`Moderasyon bildirimi olusturulamadi: ${reviewId}`);
      }
    }
  }

  private async getRecentReviewCount(userId: string): Promise<number> {
    const key = `review_count_hour:${userId}`;
    const count = await this.redis.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  private async checkDuplicateContent(userId: string, content: string): Promise<boolean> {
    const normalizedContent = content.trim().toLowerCase().slice(0, 200);
    const recentReviews = await this.reviewRepo
      .createQueryBuilder('review')
      .where('review.user_id = :userId', { userId })
      .andWhere('review.created_at > NOW() - INTERVAL \'7 days\'')
      .select('review.content')
      .limit(10)
      .getRawMany<{ review_content: string }>();

    return recentReviews.some((r) => {
      const existing = r.review_content?.trim().toLowerCase().slice(0, 200) ?? '';
      return existing === normalizedContent && normalizedContent.length > 30;
    });
  }
}
