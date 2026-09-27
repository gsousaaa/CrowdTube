import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddDonationEventOccurredAt1790380800000
  implements MigrationInterface
{
  name = "AddDonationEventOccurredAt1790380800000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "donation_events" ADD COLUMN "occurred_at" timestamptz',
    );
    await queryRunner.query(
      'UPDATE "donation_events" SET "occurred_at" = "created_at"',
    );
    await queryRunner.query(
      'ALTER TABLE "donation_events" ALTER COLUMN "occurred_at" SET NOT NULL',
    );
    await queryRunner.query(
      'CREATE INDEX "IDX_donation_events_occurred_at" ON "donation_events" ("occurred_at")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX "IDX_donation_events_occurred_at"',
    );
    await queryRunner.query(
      'ALTER TABLE "donation_events" DROP COLUMN "occurred_at"',
    );
  }
}
