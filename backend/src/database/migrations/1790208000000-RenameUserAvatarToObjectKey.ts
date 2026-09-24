import type { MigrationInterface, QueryRunner } from "typeorm";

export class RenameUserAvatarToObjectKey1790208000000
  implements MigrationInterface
{
  name = "RenameUserAvatarToObjectKey1790208000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" RENAME COLUMN "avatar_url" TO "avatar_object_key"',
    );
    await queryRunner.query(
      'ALTER TABLE "users" ALTER COLUMN "avatar_object_key" TYPE varchar(1024)',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "users" ALTER COLUMN "avatar_object_key" TYPE varchar(500)',
    );
    await queryRunner.query(
      'ALTER TABLE "users" RENAME COLUMN "avatar_object_key" TO "avatar_url"',
    );
  }
}
