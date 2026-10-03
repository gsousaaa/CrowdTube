import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddDonationEventCampaignHistoryIndex1790467200000
  implements MigrationInterface
{
  name = "AddDonationEventCampaignHistoryIndex1790467200000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE INDEX "IDX_donation_events_campaign_history"
      ON "donation_events" (
        "chain_id",
        "contract_address",
        "onchain_campaign_id",
        "block_number" DESC,
        "log_index" DESC
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX "IDX_donation_events_campaign_history"',
    );
  }
}
