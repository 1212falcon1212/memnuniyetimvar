import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { Review, ReviewStatus } from '../reviews/entities/review.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async findAll(limit: number): Promise<Tag[]> {
    return this.tagRepository.find({
      order: { usageCount: 'DESC' },
      take: limit,
    });
  }

  async findBySlug(slug: string, page: number, limit: number) {
    const tag = await this.tagRepository.findOne({
      where: { slug },
    });

    if (!tag) {
      throw new NotFoundException({
        code: 'TAG_NOT_FOUND',
        message: 'Etiket bulunamadi',
      });
    }

    const skip = (page - 1) * limit;

    const [data, total] = await this.reviewRepository
      .createQueryBuilder('review')
      .innerJoin('review.tags', 'tag', 'tag.id = :tagId', { tagId: tag.id })
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.company', 'company')
      .where('review.status = :status', { status: ReviewStatus.PUBLISHED })
      .orderBy('review.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      tag,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
