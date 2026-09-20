import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCampaigns1790000000000 implements MigrationInterface {
  name = "CreateCampaigns1790000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "campaigns" (
        "id" uuid NOT NULL,
        "creator_id" uuid NOT NULL,
        "metadata_id" varchar(66) NOT NULL,
        "chain_id" integer,
        "contract_address" varchar(42),
        "onchain_campaign_id" numeric(78, 0),
        "creation_transaction_hash" varchar(66),
        "title" varchar(80) NOT NULL,
        "category" varchar(32) NOT NULL,
        "description" varchar(500) NOT NULL,
        "youtube_url" varchar(500) NOT NULL,
        "image_object_key" varchar(1024),
        "search_text" varchar(700) NOT NULL,
        "status" varchar(32) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_campaigns_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_campaigns_metadata_id" UNIQUE ("metadata_id"),
        CONSTRAINT "CK_campaigns_status" CHECK (
          "status" IN ('draft', 'pending_onchain', 'published', 'failed')
        ),
        CONSTRAINT "FK_campaigns_creator_id" FOREIGN KEY ("creator_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      'CREATE INDEX "IDX_campaigns_creator_id" ON "campaigns" ("creator_id")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_campaigns_status" ON "campaigns" ("status")',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_campaigns_search_text" ON "campaigns" ("search_text")',
    );
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_campaigns_onchain_reference"
      ON "campaigns" ("chain_id", "contract_address", "onchain_campaign_id")
      WHERE "chain_id" IS NOT NULL
        AND "contract_address" IS NOT NULL
        AND "onchain_campaign_id" IS NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "campaigns"');
  }
}
