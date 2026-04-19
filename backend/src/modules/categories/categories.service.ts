import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
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
    return this.categoryRepo.find({
      where: { isActive: true, parentId: IsNull() },
      order: { reviewCount: 'DESC' },
      take: 10,
    });
  }

  /**
   * Return top companies in a category ordered by average rating.
   * Companies module is not yet integrated; returns empty array for now.
   */
  async findTopByCategory(
    slug: string,
    limit: number,
  ): Promise<{ slug: string; limit: number; companies: unknown[] }> {
    const category = await this.categoryRepo.findOne({
      where: { slug, isActive: true },
    });

    if (!category) {
      throw new NotFoundException(`Kategori bulunamadı: ${slug}`);
    }

    // Companies module not yet integrated
    return {
      slug: category.slug,
      limit,
      companies: [],
    };
  }
}
