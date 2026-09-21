import type { MigrationInterface, QueryRunner } from "typeorm";

export class CreateChainSyncState1790000000001 implements MigrationInterface {
  name = "CreateChainSyncState1790000000001";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "chain_sync_state" (
        "chain_id" integer NOT NULL,
        "contract_address" varchar(42) NOT NULL,
        "last_processed_block" numeric(78, 0) NOT NULL,
        CONSTRAINT "PK_chain_sync_state" PRIMARY KEY ("chain_id", "contract_address")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "chain_sync_state"');
  }
}
