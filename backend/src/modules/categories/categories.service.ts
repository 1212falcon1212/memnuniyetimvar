import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import Redis from 'ioredis';
import { Category } from './entities/category.entity';
import { Company, CompanyStatus } from '../companies/entities/company.entity';
import { SearchService, CategorySearchDocument } from '../search/search.service';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);
  private readonly redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT || 6380),
  });

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    private readonly searchService: SearchService,
  ) {}

  /**
   * Return all active categories as a nested tree (parent -> children).
   */
  async findAll(): Promise<Category[]> {
    const categories = await this.categoryRepo.find({
      where: { isActive: true, parentId: IsNull() },
      relations: ['children'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    // Filter inactive children and sort them
    for (const category of categories) {
      if (category.children) {
        category.children = category.children
          .filter((child) => child.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
      }
    }

    return categories;
  }

  /**
   * Return a category by its slug, including children and company count.
   */
  async findBySlug(slug: string): Promise<Category & { companiesCount: number }> {
    const category = await this.categoryRepo.findOne({
      where: { slug, isActive: true },
      relations: ['children'],
    });

    if (!category) {
      throw new NotFoundException(`Kategori bulunamadı: ${slug}`);
    }

    // Filter inactive children
    if (category.children) {
      category.children = category.children
        .filter((child) => child.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    }

    // Count companies linked to this category
    const companiesCount = await this.categoryRepo
      .createQueryBuilder('c')
      .leftJoin('c.companyCategories', 'cc')
      .where('c.id = :id', { id: category.id })
      .select('COUNT(DISTINCT cc.companyId)', 'count')
      .getRawOne()
      .then((row) => parseInt(row?.count ?? '0', 10));

    return Object.assign(category, { companiesCount });
  }

  /**
   * Return the 10 categories with the highest review_count.
   */
  async findPopular(): Promise<Category[]> {
    const cacheKey = 'cache:categories:popular';
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached) as Category[];
    } catch (error) {
      this.logger.warn('Populer kategoriler cache okunamadi');
    }

    const categories = await this.categoryRepo.find({
      where: { isActive: true, parentId: IsNull() },
      order: { reviewCount: 'DESC' },
      take: 10,
    });

    try {
      await this.redis.set(cacheKey, JSON.stringify(categories), 'EX', 300);
    } catch (error) {
      this.logger.warn('Populer kategoriler cache yazilamadi');
    }

    return categories;
  }

  /**
   * Return top companies in a category ordered by average rating.
   * Companies module is not yet integrated; returns empty array for now.
   */
  async findTopByCategory(
    slug: string,
    limit: number,
  ) {
    const category = await this.categoryRepo.findOne({
      where: { slug, isActive: true },
      relations: ['children'],
    });

    if (!category) {
      throw new NotFoundException(`Kategori bulunamadı: ${slug}`);
    }

    const categoryIds = [category.id];
    if (category.children?.length) {
      categoryIds.push(...category.children.map((c) => c.id));
    }

    const companies = await this.companyRepo.find({
      where: categoryIds.map((cid) => ({ categoryId: cid, status: CompanyStatus.ACTIVE })),
      order: { memnuniyetScore: 'DESC' },
      take: limit,
    });

    return {
      slug: category.slug,
      name: category.name,
      limit,
      companies,
    };
  }
}
