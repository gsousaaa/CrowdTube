import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersAndUserWallets1770000000000
  implements MigrationInterface
{
  name = "CreateUsersAndUserWallets1770000000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL,
        "display_name" varchar(100),
        "bio" varchar(500),
        "youtube_channel_url" varchar(500),
        "avatar_url" varchar(500),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_wallets" (
        "id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "wallet_address" varchar(42) NOT NULL,
        "label" varchar(80),
        "is_primary" boolean NOT NULL DEFAULT false,
        "verified_at" timestamptz NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_wallets_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_wallets_wallet_address" UNIQUE ("wallet_address"),
        CONSTRAINT "FK_user_wallets_user_id" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_wallets_user_id"
      ON "user_wallets" ("user_id")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_user_wallets_primary_per_user"
      ON "user_wallets" ("user_id")
      WHERE "is_primary" = true
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "user_wallets"');
    await queryRunner.query('DROP TABLE "users"');
  }
}
