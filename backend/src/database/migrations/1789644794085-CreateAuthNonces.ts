import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuthNonces1789644794085 implements MigrationInterface {
    name = 'CreateAuthNonces1789644794085'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "auth_nonces" (
                "id" uuid NOT NULL,
                "user_id" uuid,
                "wallet_address" character varying(42) NOT NULL,
                "purpose" character varying(20) NOT NULL,
                "nonce" character varying(64) NOT NULL,
                "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "used_at" TIMESTAMP WITH TIME ZONE,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_a7080c443def2e46ba5c4b87f38" UNIQUE ("nonce"),
                CONSTRAINT "CHK_auth_nonces_purpose" CHECK ("purpose" IN ('login', 'link_wallet')),
                CONSTRAINT "PK_43f4e702fc79d337c03bce1de16" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_auth_nonces_wallet_purpose" ON "auth_nonces" ("wallet_address", "purpose")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_auth_nonces_expires_at" ON "auth_nonces" ("expires_at")
        `);
        await queryRunner.query(`
            ALTER TABLE "auth_nonces"
            ADD CONSTRAINT "FK_auth_nonces_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "auth_nonces" DROP CONSTRAINT "FK_auth_nonces_user_id"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_auth_nonces_expires_at"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_auth_nonces_wallet_purpose"
        `);
        await queryRunner.query(`
            DROP TABLE "auth_nonces"
        `);
    }

}
