import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Faz 8 - Yasal Reklam ve Marka İş Birliği Modülü
 * - ad_packages, ad_requests, review_invitations tabloları
 * - companies: is_sponsored, sponsored_until
 * - reviews: verified_customer, source, invitation_id
 */
export class AdvertisingAndVerifiedReviews1716300000000 implements MigrationInterface {
  name = 'AdvertisingAndVerifiedReviews1716300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Enum tipleri ─────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE "ad_type_enum" AS ENUM ('sponsored_showcase', 'featured_campaign', 'category_sponsorship')
    `);
    await queryRunner.query(`
      CREATE TYPE "ad_request_status_enum" AS ENUM ('pending', 'approved', 'rejected', 'active', 'completed', 'cancelled')
    `);
    await queryRunner.query(`
      CREATE TYPE "invitation_status_enum" AS ENUM ('pending', 'used', 'expired', 'cancelled')
    `);
    await queryRunner.query(`
      CREATE TYPE "review_source_enum" AS ENUM ('organic', 'campaign_invite')
    `);

    // ── ad_packages ──────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "ad_packages" (
        "id" SERIAL NOT NULL,
        "name" varchar(150) NOT NULL,
        "type" "ad_type_enum" NOT NULL,
        "description" text,
        "price" decimal(10,2) NOT NULL DEFAULT 0,
        "duration_days" int NOT NULL DEFAULT 30,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ad_packages" PRIMARY KEY ("id")
      )
    `);

    // ── ad_requests ──────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "ad_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "requested_by_user_id" uuid NOT NULL,
        "package_id" int,
        "type" "ad_type_enum" NOT NULL,
        "status" "ad_request_status_enum" NOT NULL DEFAULT 'pending',
        "category_id" int,
        "budget" decimal(10,2),
        "requested_start_date" TIMESTAMP,
        "start_date" TIMESTAMP,
        "end_date" TIMESTAMP,
        "note" text,
        "admin_note" text,
        "impressions" int NOT NULL DEFAULT 0,
        "clicks" int NOT NULL DEFAULT 0,
        "conversions" int NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ad_requests" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ad_requests_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ad_requests_package" FOREIGN KEY ("package_id") REFERENCES "ad_packages"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_ad_requests_company_id" ON "ad_requests" ("company_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_ad_requests_status" ON "ad_requests" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_ad_requests_requested_by" ON "ad_requests" ("requested_by_user_id")`);

    // ── review_invitations ───────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "review_invitations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "created_by_user_id" uuid NOT NULL,
        "token" varchar(64) NOT NULL,
        "campaign_name" varchar(150),
        "recipient_email" varchar(255),
        "recipient_phone" varchar(20),
        "status" "invitation_status_enum" NOT NULL DEFAULT 'pending',
        "expires_at" TIMESTAMP NOT NULL,
        "used_review_id" uuid,
        "used_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_review_invitations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_review_invitations_token" UNIQUE ("token"),
        CONSTRAINT "FK_review_invitations_company" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_review_invitations_token" ON "review_invitations" ("token")`);
    await queryRunner.query(`CREATE INDEX "IDX_review_invitations_company_id" ON "review_invitations" ("company_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_review_invitations_status" ON "review_invitations" ("status")`);

    // ── companies: sponsorluk alanları ───────────────────────
    await queryRunner.query(`ALTER TABLE "companies" ADD COLUMN "is_sponsored" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "companies" ADD COLUMN "sponsored_until" TIMESTAMP`);

    // ── reviews: doğrulanmış müşteri alanları ────────────────
    await queryRunner.query(`ALTER TABLE "reviews" ADD COLUMN "verified_customer" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "reviews" ADD COLUMN "source" "review_source_enum" NOT NULL DEFAULT 'organic'`);
    await queryRunner.query(`ALTER TABLE "reviews" ADD COLUMN "invitation_id" uuid`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN "invitation_id"`);
    await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN "source"`);
    await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN "verified_customer"`);
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "sponsored_until"`);
    await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "is_sponsored"`);

    await queryRunner.query(`DROP TABLE "review_invitations"`);
    await queryRunner.query(`DROP TABLE "ad_requests"`);
    await queryRunner.query(`DROP TABLE "ad_packages"`);

    await queryRunner.query(`DROP TYPE "review_source_enum"`);
    await queryRunner.query(`DROP TYPE "invitation_status_enum"`);
    await queryRunner.query(`DROP TYPE "ad_request_status_enum"`);
    await queryRunner.query(`DROP TYPE "ad_type_enum"`);
  }
}
