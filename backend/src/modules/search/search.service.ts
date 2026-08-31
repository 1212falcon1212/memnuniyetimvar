import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch, Index } from 'meilisearch';

export interface CompanySearchDocument {
  id: string;
  name: string;
  slug: string;
  description: string;
  city: string;
  categoryName: string;
  avgRating: number;
  reviewCount: number;
  memnuniyetScore: number;
  status: string;
}

export interface ReviewSearchDocument {
  id: string;
  title: string;
  content: string;
  slug: string;
  companyName: string;
  companySlug: string;
  userName: string;
  rating: number;
  status: string;
}

export interface CategorySearchDocument {
  id: number;
  name: string;
  slug: string;
  description: string;
  parentId: number | null;
  isActive: boolean;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private client: MeiliSearch;
  private companiesIndex: Index;
  private reviewsIndex: Index;
  private categoriesIndex: Index;

  constructor(private readonly configService: ConfigService) {
    this.client = new MeiliSearch({
      host: this.configService.get<string>('meilisearch.host', 'http://localhost:7700'),
      apiKey: this.configService.get<string>('meilisearch.apiKey'),
    });
  }

  async onModuleInit() {
    try {
      await this.setupIndexes();
      this.logger.log('Meilisearch indexleri hazir');
    } catch (error) {
      this.logger.warn(`Meilisearch baglanti hatasi: ${error.message}`);
    }
  }

  private async setupIndexes() {
    // Companies index
    this.companiesIndex = this.client.index('companies');
    await this.companiesIndex.updateSettings({
      searchableAttributes: ['name', 'description', 'city', 'categoryName'],
      filterableAttributes: ['status', 'city', 'categoryName', 'avgRating'],
      sortableAttributes: ['avgRating', 'reviewCount', 'memnuniyetScore', 'name'],
      rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
    });

    // Reviews index
    this.reviewsIndex = this.client.index('reviews');
    await this.reviewsIndex.updateSettings({
      searchableAttributes: ['title', 'content', 'companyName', 'userName'],
      filterableAttributes: ['status', 'rating', 'companySlug'],
      sortableAttributes: ['rating'],
      rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
    });

    // Categories index
    this.categoriesIndex = this.client.index('categories');
    await this.categoriesIndex.updateSettings({
      searchableAttributes: ['name', 'description', 'slug'],
      filterableAttributes: ['isActive', 'parentId'],
      rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
    });
  }

  // ── Company index islemleri ────────────────────────────────

  async indexCompany(doc: CompanySearchDocument): Promise<void> {
    await this.companiesIndex.addDocuments([doc]);
  }

  async indexCompanies(docs: CompanySearchDocument[]): Promise<void> {
    if (docs.length === 0) return;
    await this.companiesIndex.addDocuments(docs);
  }

  async removeCompany(id: string): Promise<void> {
    await this.companiesIndex.deleteDocument(id);
  }

  async updateCompany(doc: CompanySearchDocument): Promise<void> {
    await this.companiesIndex.updateDocuments([doc]);
  }

  // ── Review index islemleri ─────────────────────────────────

  async indexReview(doc: ReviewSearchDocument): Promise<void> {
    await this.reviewsIndex.addDocuments([doc]);
  }

  async indexReviews(docs: ReviewSearchDocument[]): Promise<void> {
    if (docs.length === 0) return;
    await this.reviewsIndex.addDocuments(docs);
  }

  async removeReview(id: string): Promise<void> {
    await this.reviewsIndex.deleteDocument(id);
  }

  async updateReview(doc: ReviewSearchDocument): Promise<void> {
    await this.reviewsIndex.updateDocuments([doc]);
  }

  // ── Category index islemleri ──────────────────────────────

  async indexCategory(doc: CategorySearchDocument): Promise<void> {
    await this.categoriesIndex.addDocuments([doc]);
  }

  async indexCategories(docs: CategorySearchDocument[]): Promise<void> {
    if (docs.length === 0) return;
    await this.categoriesIndex.addDocuments(docs);
  }

  async removeCategory(id: number): Promise<void> {
    await this.categoriesIndex.deleteDocument(id);
  }

  async updateCategory(doc: CategorySearchDocument): Promise<void> {
    await this.categoriesIndex.updateDocuments([doc]);
  }

  // ── Arama ──────────────────────────────────────────────────

  async searchCompanies(query: string, options?: {
    filter?: string;
    sort?: string[];
    limit?: number;
    offset?: number;
  }) {
    return this.companiesIndex.search(query, {
      filter: options?.filter,
      sort: options?.sort,
      limit: options?.limit || 20,
      offset: options?.offset || 0,
    });
  }

  async searchReviews(query: string, options?: {
    filter?: string;
    sort?: string[];
    limit?: number;
    offset?: number;
  }) {
    return this.reviewsIndex.search(query, {
      filter: options?.filter,
      sort: options?.sort,
      limit: options?.limit || 20,
      offset: options?.offset || 0,
    });
  }

  async searchCategories(query: string, options?: {
    filter?: string;
    limit?: number;
    offset?: number;
  }) {
    return this.categoriesIndex.search(query, {
      filter: options?.filter,
      limit: options?.limit || 20,
      offset: options?.offset || 0,
    });
  }

  async searchAll(query: string, limit = 10) {
    const [companies, reviews, categories] = await Promise.all([
      this.searchCompanies(query, { limit, filter: 'status = "active"' }),
      this.searchReviews(query, { limit, filter: 'status = "published"' }),
      this.searchCategories(query, { limit, filter: 'isActive = true' }),
    ]);

    return {
      companies: companies.hits,
      reviews: reviews.hits,
      categories: categories.hits,
      totalCompanies: companies.estimatedTotalHits,
      totalReviews: reviews.estimatedTotalHits,
      totalCategories: categories.estimatedTotalHits,
    };
  }

  async suggest(query: string, limit = 5) {
    const [companies, categories] = await Promise.all([
      this.searchCompanies(query, { limit, filter: 'status = "active"' }),
      this.searchCategories(query, { limit, filter: 'isActive = true' }),
    ]);

    return {
      companies: companies.hits.map((h: any) => ({ id: h.id, name: h.name, slug: h.slug, avgRating: h.avgRating, reviewCount: h.reviewCount })),
      categories: categories.hits.map((h: any) => ({ id: h.id, name: h.name, slug: h.slug })),
    };
  }
}
