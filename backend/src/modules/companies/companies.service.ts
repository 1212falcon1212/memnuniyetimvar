import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company, CompanyStatus } from './entities/company.entity';
import { CompanyCategory } from './entities/company-category.entity';
import { CompanyClaim } from './entities/company-claim.entity';
import { Category } from '../categories/entities/category.entity';
import { Review } from '../reviews/entities/review.entity';
import {
  CreateCompanyDto,
  CompanyFilterDto,
  ClaimCompanyDto,
} from './dto';
import { PaginationDto } from '../../common/dto';
import { generateUniqueSlug } from '../../common/utils/slug.util';

@Injectable()
export class CompaniesService {
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
  ) {
    const company = await this.findBySlug(slug);

    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { companyId: company.id, status: 'published' as any },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return {
      data: reviews,
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
    return this.companyRepository.find({
      where: { status: CompanyStatus.ACTIVE },
      relations: ['category'],
      order: { memnuniyetScore: 'DESC' },
      take: limit,
    });
  }

  async findTrending(limit: number) {
    return this.companyRepository.find({
      where: { status: CompanyStatus.ACTIVE },
      relations: ['category'],
      order: { reviewCount: 'DESC' },
      take: limit,
    });
  }

  async suggest(dto: CreateCompanyDto): Promise<Company> {
    const slug = generateUniqueSlug(dto.name);

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
    });

    if (!category) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Kategori bulunamadi',
      });
    }

    const [data, total] = await this.companyRepository.findAndCount({
      where: {
        categoryId: category.id,
        status: CompanyStatus.ACTIVE,
      },
      relations: ['category'],
      order: { memnuniyetScore: 'DESC' },
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

  async search(query: string, limit: number) {
    return this.companyRepository
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.category', 'category')
      .where('company.status = :status', { status: CompanyStatus.ACTIVE })
      .andWhere('company.name ILIKE :query', { query: `%${query}%` })
      .orderBy('company.memnuniyetScore', 'DESC')
      .take(limit)
      .getMany();
  }
}
