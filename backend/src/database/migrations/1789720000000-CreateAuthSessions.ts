import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuthSessions1789720000000 implements MigrationInterface {
  name = "CreateAuthSessions1789720000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "auth_sessions" (
        "id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "wallet_id" uuid NOT NULL,
        "token_hash" varchar(64) NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "revoked_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_auth_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_auth_sessions_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "FK_auth_sessions_user_id" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_auth_sessions_wallet_id" FOREIGN KEY ("wallet_id")
          REFERENCES "user_wallets"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_auth_sessions_user_id"
      ON "auth_sessions" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_auth_sessions_expires_at"
      ON "auth_sessions" ("expires_at")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "auth_sessions"');
  }
}
