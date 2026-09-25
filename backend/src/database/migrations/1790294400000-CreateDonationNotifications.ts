import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDonationNotifications1790294400000
  implements MigrationInterface
{
  name = "CreateDonationNotifications1790294400000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "chain_sync_state" DROP CONSTRAINT "PK_chain_sync_state"',
    );
    await queryRunner.query(`
      ALTER TABLE "chain_sync_state"
      ADD COLUMN "stream_name" varchar(80) NOT NULL DEFAULT 'campaign_creation'
    `);
    await queryRunner.query(`
      ALTER TABLE "chain_sync_state"
      ADD CONSTRAINT "PK_chain_sync_state"
      PRIMARY KEY ("chain_id", "contract_address", "stream_name")
    `);

    await queryRunner.query(`
      CREATE TABLE "donation_events" (
        "id" uuid NOT NULL,
        "chain_id" integer NOT NULL,
        "contract_address" varchar(42) NOT NULL,
        "onchain_campaign_id" numeric(78, 0) NOT NULL,
        "donor_address" varchar(42) NOT NULL,
        "amount_wei" numeric(78, 0) NOT NULL,
        "transaction_hash" varchar(66) NOT NULL,
        "log_index" integer NOT NULL,
        "block_number" numeric(78, 0) NOT NULL,
        "status" varchar(32) NOT NULL,
        "attempt_count" integer NOT NULL DEFAULT 0,
        "last_attempted_at" timestamptz,
        "processed_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_donation_events_id" PRIMARY KEY ("id"),
        CONSTRAINT "CK_donation_events_status"
          CHECK ("status" IN ('pending', 'processed')),
        CONSTRAINT "UQ_donation_events_source"
          UNIQUE ("chain_id", "contract_address", "transaction_hash", "log_index")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_donation_events_pending"
      ON "donation_events" ("status", "created_at")
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "campaign_id" uuid NOT NULL,
        "donation_event_id" uuid NOT NULL,
        "type" varchar(50) NOT NULL,
        "read_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_notifications_donation_event_id" UNIQUE ("donation_event_id"),
        CONSTRAINT "CK_notifications_type"
          CHECK ("type" IN ('donation_received')),
        CONSTRAINT "FK_notifications_user_id" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_notifications_campaign_id" FOREIGN KEY ("campaign_id")
          REFERENCES "campaigns"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_notifications_donation_event_id" FOREIGN KEY ("donation_event_id")
          REFERENCES "donation_events"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_user_created_at"
      ON "notifications" ("user_id", "created_at" DESC)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "notifications"');
    await queryRunner.query('DROP TABLE "donation_events"');
    await queryRunner.query(
      'DELETE FROM "chain_sync_state" WHERE "stream_name" <> \'campaign_creation\'',
    );
    await queryRunner.query(
      'ALTER TABLE "chain_sync_state" DROP CONSTRAINT "PK_chain_sync_state"',
    );
    await queryRunner.query(
      'ALTER TABLE "chain_sync_state" DROP COLUMN "stream_name"',
    );
    await queryRunner.query(`
      ALTER TABLE "chain_sync_state"
      ADD CONSTRAINT "PK_chain_sync_state"
      PRIMARY KEY ("chain_id", "contract_address")
    `);
  }
}
