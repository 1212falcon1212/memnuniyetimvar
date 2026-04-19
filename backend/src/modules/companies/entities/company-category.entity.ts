import {
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { Company } from './company.entity';
import { Category } from '../../categories/entities/category.entity';

@Entity('company_categories')
export class CompanyCategory {
  @PrimaryColumn({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @PrimaryColumn({ name: 'category_id', type: 'int' })
  categoryId: number;

  // ── Relations ──────────────────────────────────────────────

  @ManyToOne(() => Company, (company) => company.companyCategories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => Category, (category) => category.companyCategories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;
}
