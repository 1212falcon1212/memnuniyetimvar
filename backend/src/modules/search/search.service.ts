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

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private client: MeiliSearch;
  private companiesIndex: Index;
  private reviewsIndex: Index;

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

  async searchAll(query: string, limit = 10) {
    const [companies, reviews] = await Promise.all([
      this.searchCompanies(query, { limit }),
      this.searchReviews(query, { limit, filter: 'status = "published"' }),
    ]);

    return {
      companies: companies.hits,
      reviews: reviews.hits,
      totalCompanies: companies.estimatedTotalHits,
      totalReviews: reviews.estimatedTotalHits,
    };
  }
}
