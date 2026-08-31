import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import Redis from 'ioredis';
import { Company, CompanyStatus } from './entities/company.entity';
import { CompanyCategory } from './entities/company-category.entity';
import { CompanyClaim } from './entities/company-claim.entity';
import { Category } from '../categories/entities/category.entity';
import { Review, ReviewStatus } from '../reviews/entities/review.entity';
import { User, UserStatus } from '../users/entities/user.entity';
import { SearchService, CompanySearchDocument } from '../search/search.service';
import {
  CreateCompanyDto,
  CompanyFilterDto,
  ClaimCompanyDto,
} from './dto';
import { PaginationDto } from '../../common/dto';
import { generateSlug } from '../../common/utils/slug.util';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);
  private readonly redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT || 6380),
  });

  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(CompanyCategory)
    private readonly companyCategoryRepository: Repository<CompanyCategory>,
    @InjectRepository(CompanyClaim)
    private readonly companyClaimRepository: Repository<CompanyClaim>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly searchService: SearchService,
  ) {}

  async findAll(filter: CompanyFilterDto) {
    const qb = this.companyRepository
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.category', 'category')
      .where('company.status = :status', { status: CompanyStatus.ACTIVE });

    if (filter.city) {
      qb.andWhere('company.city = :city', { city: filter.city });
    }

    if (filter.categoryId) {
      qb.andWhere('company.categoryId = :categoryId', {
        categoryId: filter.categoryId,
      });
    }

    if (filter.search) {
      qb.andWhere('company.name ILIKE :search', {
        search: `%${filter.search}%`,
      });
    }

    switch (filter.sortBy) {
      case 'rating':
        qb.orderBy('company.avgRating', 'DESC');
        break;
      case 'reviews':
        qb.orderBy('company.reviewCount', 'DESC');
        break;
      case 'name':
        qb.orderBy('company.name', 'ASC');
        break;
      case 'created_at':
        qb.orderBy('company.createdAt', 'DESC');
        break;
      default:
        qb.orderBy('company.memnuniyetScore', 'DESC');
        break;
    }

    const total = await qb.getCount();
    const data = await qb.skip(filter.skip).take(filter.limit).getMany();

    return {
      data,
      meta: {
        page: filter.page,
        limit: filter.limit,
        total,
        totalPages: Math.ceil(total / filter.limit),
      },
    };
  }

  async findBySlug(slug: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { slug, status: CompanyStatus.ACTIVE },
      relations: ['category'],
    });

    if (!company) {
      throw new NotFoundException({
        code: 'COMPANY_NOT_FOUND',
        message: 'Firma bulunamadi',
      });
    }

    return company;
  }

  async findReviewsByCompany(
    slug: string,
    pagination: PaginationDto,
    filters?: { sortBy?: string; rating?: string },
  ) {
    const company = await this.findBySlug(slug);

    const where: Record<string, unknown> = {
      companyId: company.id,
      status: ReviewStatus.PUBLISHED,
    };

    if (filters?.rating) {
      const r = Number(filters.rating);
      if (r >= 1 && r <= 5) where.rating = r;
    }

    const order: Record<string, string> = { createdAt: 'DESC' };
    if (filters?.sortBy === 'helpful') {
      order.helpfulCount = 'DESC';
      order.createdAt = 'DESC';
    } else if (filters?.sortBy === 'highest') {
      order.rating = 'DESC';
      order.createdAt = 'DESC';
    } else if (filters?.sortBy === 'lowest') {
      order.rating = 'ASC';
      order.createdAt = 'DESC';
    }

    const [data, total] = await this.reviewRepository.findAndCount({
      where,
      relations: ['user', 'images', 'tags', 'companyResponses'],
      order,
      skip: pagination.skip,
      take: pagination.limit,
    });

    return {
      data,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async getStats(slug: string) {
    const company = await this.findBySlug(slug);

    return {
      avgRating: Number(company.avgRating),
      reviewCount: company.reviewCount,
      responseRate: Number(company.responseRate),
      memnuniyetScore: Number(company.memnuniyetScore),
    };
  }

  async findTop(limit: number) {
    const cacheKey = `cache:companies:top:${limit}`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached) as Array<Company & { weeklyChange: number }>;
    } catch (error) {
      this.logger.warn('Top firmalar cache okunamadi');
    }

    const companies = await this.companyRepository.find({
      where: { status: CompanyStatus.ACTIVE },
      relations: ['category'],
      order: { memnuniyetScore: 'DESC' },
      take: limit,
    });

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const result = await Promise.all(
      companies.map(async (company) => {
        const lastWeekScore = await this.getLastWeekScore(company.id, oneWeekAgo);
        const weeklyChange = lastWeekScore
          ? Math.round(Number(company.memnuniyetScore) - lastWeekScore)
          : 0;
        return { ...company, weeklyChange };
      }),
    );

    try {
      await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
    } catch (error) {
      this.logger.warn('Top firmalar cache yazilamadi');
    }

    return result;
  }

  async findTrending(limit: number) {
    const cacheKey = `cache:companies:trending:${limit}`;
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached) as Array<Company & { growthPercent: number }>;
    } catch (error) {
      this.logger.warn('Trend firmalar cache okunamadi');
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const companies = await this.companyRepository.find({
      where: { status: CompanyStatus.ACTIVE },
      relations: ['category'],
      order: { reviewCount: 'DESC' },
      take: limit * 2,
    });

    const withGrowth = await Promise.all(
      companies.map(async (company) => {
        const [thisWeek, lastWeek] = await Promise.all([
          this.reviewRepository.count({
            where: {
              companyId: company.id,
              status: ReviewStatus.PUBLISHED,
              createdAt: MoreThanOrEqual(oneWeekAgo),
            },
          }),
          this.reviewRepository.count({
            where: {
              companyId: company.id,
              status: ReviewStatus.PUBLISHED,
              createdAt: MoreThanOrEqual(twoWeeksAgo),
            },
          }),
        ]);

        const growthPercent = lastWeek > 0
          ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
          : thisWeek > 0 ? 100 : 0;

        return { ...company, growthPercent };
      }),
    );

    const result = withGrowth
      .sort((a, b) => b.growthPercent - a.growthPercent)
      .slice(0, limit);

    try {
      await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
    } catch (error) {
      this.logger.warn('Trend firmalar cache yazilamadi');
    }

    return result;
  }

  private async getLastWeekScore(companyId: string, since: Date): Promise<number | null> {
    const result = await this.reviewRepository
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avgRating')
      .where('r.company_id = :companyId', { companyId })
      .andWhere('r.status = :status', { status: 'published' })
      .andWhere('r.created_at < :since', { since })
      .getRawOne<{ avgRating: string | null }>();

    if (!result?.avgRating) return null;
    const avgRating = Number(result.avgRating);
    const reviewCountRow = await this.reviewRepository
      .createQueryBuilder('r')
      .select('COUNT(r.id)', 'cnt')
      .where('r.company_id = :companyId', { companyId })
      .andWhere('r.status = :status', { status: 'published' })
      .andWhere('r.created_at < :since', { since })
      .getRawOne<{ cnt: string }>();

    const reviewCount = Number(reviewCountRow?.cnt || 0);
    const responseRate = 84;
    const reviewVolumeScore = Math.min(reviewCount / 50, 1) * 100;
    return Math.round((avgRating / 5 * 100 * 0.6) + (responseRate * 0.3) + (reviewVolumeScore * 0.1));
  }

  async suggest(dto: CreateCompanyDto): Promise<Company> {
    const slug = await this.createUniqueCompanySlug(dto.name);

    const company = this.companyRepository.create({
      name: dto.name,
      slug,
      description: dto.description ?? null,
      website: dto.website ?? null,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      address: dto.address ?? null,
      city: dto.city ?? null,
      district: dto.district ?? null,
      taxNumber: dto.taxNumber ?? null,
      categoryId: dto.categoryId ?? null,
      status: CompanyStatus.PENDING,
    });

    return this.companyRepository.save(company);
  }

  async claimCompany(
    companyId: string,
    dto: ClaimCompanyDto,
  ): Promise<CompanyClaim> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException({
        code: 'COMPANY_NOT_FOUND',
        message: 'Firma bulunamadi',
      });
    }

    const claim = this.companyClaimRepository.create({
      companyId,
      claimerName: dto.claimerName,
      claimerEmail: dto.claimerEmail,
      claimerPhone: dto.claimerPhone,
    });

    return this.companyClaimRepository.save(claim);
  }

  async findByCategory(categorySlug: string, pagination: PaginationDto) {
    const category = await this.categoryRepository.findOne({
      where: { slug: categorySlug, isActive: true },
      relations: ['children'],
    });

    if (!category) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Kategori bulunamadi',
      });
    }

    // Ana kategori + alt kategorilerinin ID'lerini topla
    const categoryIds = [category.id];
    if (category.children?.length) {
      categoryIds.push(...category.children.map((c) => c.id));
    }

    const qb = this.companyRepository
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.category', 'category')
      .where('company.status = :status', { status: CompanyStatus.ACTIVE })
      .andWhere('company.categoryId IN (:...categoryIds)', { categoryIds })
      .orderBy('company.memnuniyetScore', 'DESC');

    const total = await qb.getCount();
    const data = await qb.skip(pagination.skip).take(pagination.limit).getMany();

    return {
      data,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async search(query: string, limit: number) {
    try {
      const result = await this.searchService.searchCompanies(query, {
        filter: 'status = "active"',
        sort: ['memnuniyetScore:desc'],
        limit,
      });

      if (result.hits && result.hits.length > 0) {
        const ids = result.hits.map((h: any) => h.id);
        const companies = await this.companyRepository.find({
          where: ids.map((id: string) => ({ id })),
          relations: ['category'],
        });

        const ordered = ids.map((id: string) => companies.find((c) => c.id === id)).filter(Boolean);
        return ordered;
      }
    } catch (error) {
      this.logger.warn(`Meilisearch arama hatasi, DB fallback: ${error.message}`);
    }

    return this.companyRepository
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.category', 'category')
      .where('company.status = :status', { status: CompanyStatus.ACTIVE })
      .andWhere('company.name ILIKE :query', { query: `%${query}%` })
      .orderBy('company.memnuniyetScore', 'DESC')
      .take(limit)
      .getMany();
  }

  async syncToSearch(companyId: string): Promise<void> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
      relations: ['category'],
    });
    if (!company) return;

    const doc: CompanySearchDocument = {
      id: company.id,
      name: company.name,
      slug: company.slug,
      description: company.description ?? '',
      city: company.city ?? '',
      categoryName: (company as any).category?.name ?? '',
      avgRating: Number(company.avgRating) || 0,
      reviewCount: company.reviewCount || 0,
      memnuniyetScore: Number(company.memnuniyetScore) || 0,
      status: company.status,
    };

    try {
      await this.searchService.updateCompany(doc);
    } catch (error) {
      this.logger.warn(`Firma index guncelleme hatasi: ${error.message}`);
    }
  }

  async getGlobalStats() {
    const cacheKey = 'cache:stats:global';
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached) as { userCount: number; companyCount: number; reviewCount: number; avgRating: number };
    } catch (error) {
      this.logger.warn('Global stats cache okunamadi');
    }

    const userCount = await this.userRepository.count({ where: { status: UserStatus.ACTIVE } });
    const companyCount = await this.companyRepository.count({ where: { status: CompanyStatus.ACTIVE } });
    const reviewCount = await this.reviewRepository.count({ where: { status: ReviewStatus.PUBLISHED } });
    const avgRatingResult = await this.reviewRepository
      .createQueryBuilder('r')
      .select('COALESCE(AVG(r.rating), 0)', 'avgRating')
      .where('r.status = :status', { status: 'published' })
      .getRawOne<{ avgRating: string }>();

    const avgRating = Number(Number(avgRatingResult?.avgRating ?? 0).toFixed(1));

    const stats = {
      userCount,
      companyCount,
      reviewCount,
      avgRating,
    };

    try {
      await this.redis.set(cacheKey, JSON.stringify(stats), 'EX', 300);
    } catch (error) {
      this.logger.warn('Global stats cache yazilamadi');
    }

    return stats;
  }

  async removeFromSearch(companyId: string): Promise<void> {
    try {
      await this.searchService.removeCompany(companyId);
    } catch (error) {
      this.logger.warn(`Firma index silme hatasi: ${error.message}`);
    }
  }

  private async createUniqueCompanySlug(name: string): Promise<string> {
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    while (await this.companyRepository.exists({ where: { slug } })) {
      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }

    return slug;
  }
}
