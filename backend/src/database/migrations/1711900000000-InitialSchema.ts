import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1711900000000 implements MigrationInterface {
  name = 'InitialSchema1711900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // uuid-ossp extension (uuid_generate_v4 icin)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Enum tipleri
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM ('user', 'mod')
    `);
    await queryRunner.query(`
      CREATE TYPE "user_status_enum" AS ENUM ('active', 'banned', 'deleted')
    `);
    await queryRunner.query(`
      CREATE TYPE "admin_role_enum" AS ENUM ('admin', 'super_admin', 'editor')
    `);
    await queryRunner.query(`
      CREATE TYPE "company_status_enum" AS ENUM ('active', 'pending', 'hidden')
    `);
    await queryRunner.query(`
      CREATE TYPE "claim_status_enum" AS ENUM ('pending', 'approved', 'rejected')
    `);
    await queryRunner.query(`
      CREATE TYPE "review_status_enum" AS ENUM ('pending', 'published', 'rejected', 'archived')
    `);
    await queryRunner.query(`
      CREATE TYPE "response_status_enum" AS ENUM ('published', 'hidden')
    `);
    await queryRunner.query(`
      CREATE TYPE "report_reason_enum" AS ENUM ('spam', 'fake', 'inappropriate', 'other')
    `);
    await queryRunner.query(`
      CREATE TYPE "report_status_enum" AS ENUM ('pending', 'reviewed', 'dismissed')
    `);

    // ── users ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "full_name" varchar(100) NOT NULL,
        "email" varchar(255) NOT NULL,
        "phone" varchar(20) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "avatar_url" varchar(500),
        "is_phone_verified" boolean NOT NULL DEFAULT false,
        "is_email_verified" boolean NOT NULL DEFAULT false,
        "role" "user_role_enum" NOT NULL DEFAULT 'user',
        "status" "user_status_enum" NOT NULL DEFAULT 'active',
        "review_count" int NOT NULL DEFAULT 0,
        "helpful_count" int NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "UQ_users_phone" UNIQUE ("phone")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_USERS_EMAIL" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_USERS_PHONE" ON "users" ("phone")`);
    await queryRunner.query(`CREATE INDEX "IDX_USERS_STATUS" ON "users" ("status")`);

    // ── admin_users ──────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "admin_users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" varchar(255) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "full_name" varchar(100) NOT NULL,
        "role" "admin_role_enum" NOT NULL DEFAULT 'admin',
        "last_login_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_admin_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_admin_users_email" UNIQUE ("email")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ADMIN_USERS_EMAIL" ON "admin_users" ("email")`);

    // ── categories ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" SERIAL NOT NULL,
        "parent_id" int,
        "name" varchar(100) NOT NULL,
        "slug" varchar(120) NOT NULL,
        "icon" varchar(100),
        "banner_url" varchar(500),
        "description" text,
        "sort_order" int NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "review_count" int NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categories" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_categories_slug" UNIQUE ("slug"),
        CONSTRAINT "FK_categories_parent" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_categories_slug" ON "categories" ("slug")`);
    await queryRunner.query(`CREATE INDEX "IDX_categories_is_active" ON "categories" ("is_active")`);

    // ── companies ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "companies" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar(200) NOT NULL,
        "slug" varchar(220) NOT NULL,
        "logo_url" varchar(500),
        "cover_url" varchar(500),
        "description" text,
        "website" varchar(300),
        "phone" varchar(20),
        "email" varchar(255),
        "address" text,
        "city" varchar(50),
        "district" varchar(50),
        "tax_number" varchar(20),
        "is_verified" boolean NOT NULL DEFAULT false,
        "is_claimed" boolean NOT NULL DEFAULT false,
        "status" "company_status_enum" NOT NULL DEFAULT 'pending',
        "avg_rating" decimal(3,2) NOT NULL DEFAULT 0,
        "review_count" int NOT NULL DEFAULT 0,
        "response_count" int NOT NULL DEFAULT 0,
        "response_rate" decimal(5,2) NOT NULL DEFAULT 0,
        "memnuniyet_score" decimal(5,2) NOT NULL DEFAULT 0,
        "category_id" int,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_companies" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_companies_slug" UNIQUE ("slug"),
        CONSTRAINT "FK_companies_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_companies_slug" ON "companies" ("slug")`);
    await queryRunner.query(`CREATE INDEX "IDX_companies_status" ON "companies" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_companies_city" ON "companies" ("city")`);
    await queryRunner.query(`CREATE INDEX "IDX_companies_category_id" ON "companies" ("category_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_companies_created_at" ON "companies" ("created_at")`);

    // ── company_categories (join table) ──────────────────────
    await queryRunner.query(`
      CREATE TABLE "company_categories" (
        "company_id" uuid NOT NULL,
        "category_id" int NOT NULL,
        CONSTRAINT "PK_company_categories" PRIMARY KEY ("company_id", "category_id"),
        CONSTRAINT "FK_company_categories_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_company_categories_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE
      )
    `);

    // ── company_claims ───────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "company_claims" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "claimer_name" varchar(100) NOT NULL,
        "claimer_email" varchar(255) NOT NULL,
        "claimer_phone" varchar(20) NOT NULL,
        "document_url" varchar(500),
        "status" "claim_status_enum" NOT NULL DEFAULT 'pending',
        "admin_note" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "reviewed_at" TIMESTAMP,
        CONSTRAINT "PK_company_claims" PRIMARY KEY ("id"),
        CONSTRAINT "FK_company_claims_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_company_claims_company_id" ON "company_claims" ("company_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_company_claims_status" ON "company_claims" ("status")`);

    // ── reviews ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "reviews" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "company_id" uuid NOT NULL,
        "title" varchar(200) NOT NULL,
        "content" text NOT NULL,
        "rating" smallint NOT NULL,
        "status" "review_status_enum" NOT NULL DEFAULT 'pending',
        "rejection_reason" text,
        "is_featured" boolean NOT NULL DEFAULT false,
        "view_count" int NOT NULL DEFAULT 0,
        "helpful_count" int NOT NULL DEFAULT 0,
        "slug" varchar(250) NOT NULL,
        "moderated_by" uuid,
        "moderated_at" TIMESTAMP,
        "published_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_reviews_slug" UNIQUE ("slug"),
        CONSTRAINT "FK_reviews_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reviews_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_reviews_slug" ON "reviews" ("slug")`);
    await queryRunner.query(`CREATE INDEX "IDX_reviews_status" ON "reviews" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_reviews_user_id" ON "reviews" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_reviews_company_id" ON "reviews" ("company_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_reviews_created_at" ON "reviews" ("created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_reviews_is_featured" ON "reviews" ("is_featured")`);

    // ── review_images ────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "review_images" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "review_id" uuid NOT NULL,
        "image_url" varchar(500) NOT NULL,
        "thumbnail_url" varchar(500),
        "sort_order" int NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_review_images" PRIMARY KEY ("id"),
        CONSTRAINT "FK_review_images_review" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE
      )
    `);

    // ── review_helpfuls ──────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "review_helpfuls" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "review_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_review_helpfuls" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_review_helpfuls_review_user" UNIQUE ("review_id", "user_id"),
        CONSTRAINT "FK_review_helpfuls_review" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_review_helpfuls_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // ── company_responses ────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "company_responses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "review_id" uuid NOT NULL,
        "company_id" uuid NOT NULL,
        "content" text NOT NULL,
        "responder_name" varchar(100),
        "status" "response_status_enum" NOT NULL DEFAULT 'published',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_company_responses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_company_responses_review" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_company_responses_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_company_responses_review_id" ON "company_responses" ("review_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_company_responses_company_id" ON "company_responses" ("company_id")`);

    // ── tags ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "tags" (
        "id" SERIAL NOT NULL,
        "name" varchar(50) NOT NULL,
        "slug" varchar(60) NOT NULL,
        "usage_count" int NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tags" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tags_name" UNIQUE ("name"),
        CONSTRAINT "UQ_tags_slug" UNIQUE ("slug")
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_tags_slug" ON "tags" ("slug")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_tags_name" ON "tags" ("name")`);

    // ── review_tags (join table) ─────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "review_tags" (
        "review_id" uuid NOT NULL,
        "tag_id" int NOT NULL,
        CONSTRAINT "PK_review_tags" PRIMARY KEY ("review_id", "tag_id"),
        CONSTRAINT "FK_review_tags_review" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_review_tags_tag" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE
      )
    `);

    // ── refresh_tokens ───────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token" varchar(500) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "device_info" varchar(255),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_REFRESH_TOKENS_USER_ID" ON "refresh_tokens" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_REFRESH_TOKENS_TOKEN" ON "refresh_tokens" ("token")`);

    // ── notifications ────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "type" varchar(50) NOT NULL,
        "title" varchar(200) NOT NULL,
        "message" text,
        "data" jsonb,
        "is_read" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_user_id" ON "notifications" ("user_id")`);

    // ── reports ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "reports" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "reporter_id" uuid NOT NULL,
        "review_id" uuid NOT NULL,
        "reason" "report_reason_enum" NOT NULL,
        "description" text,
        "status" "report_status_enum" NOT NULL DEFAULT 'pending',
        "reviewed_by" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "reviewed_at" TIMESTAMP,
        CONSTRAINT "PK_reports" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reports_reporter" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_reports_review" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_reports_reporter_id" ON "reports" ("reporter_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_reports_review_id" ON "reports" ("review_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_reports_status" ON "reports" ("status")`);

    // ── activity_logs ────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "activity_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "admin_id" uuid,
        "action" varchar(50) NOT NULL,
        "entity_type" varchar(50) NOT NULL,
        "entity_id" uuid,
        "details" jsonb,
        "ip_address" varchar(45),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_activity_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_activity_logs_admin" FOREIGN KEY ("admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_activity_logs_admin_id" ON "activity_logs" ("admin_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_activity_logs_action" ON "activity_logs" ("action")`);

    // ── pages ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "pages" (
        "id" SERIAL NOT NULL,
        "title" varchar(200) NOT NULL,
        "slug" varchar(220) NOT NULL,
        "content" text,
        "meta_title" varchar(200),
        "meta_description" varchar(300),
        "is_published" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pages" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_pages_slug" UNIQUE ("slug")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_pages_slug" ON "pages" ("slug")`);

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "pages" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "activity_logs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reports" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "review_tags" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tags" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "company_responses" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "review_helpfuls" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "review_images" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reviews" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "company_claims" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "company_categories" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "companies" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "admin_users" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);

    await queryRunner.query(`DROP TYPE IF EXISTS "report_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "report_reason_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "response_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "review_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "claim_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "company_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "admin_role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
  }
}
