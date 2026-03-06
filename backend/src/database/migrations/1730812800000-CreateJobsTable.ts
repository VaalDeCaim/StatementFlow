import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateJobsTable1730812800000 implements MigrationInterface {
  name = 'CreateJobsTable1730812800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      CREATE TYPE "jobs_status_enum" AS ENUM ('pending', 'processing', 'completed', 'failed');
      CREATE TYPE "jobs_format_enum" AS ENUM ('mt940', 'camt053');
    `);
    await queryRunner.query(`
      CREATE TABLE "jobs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" character varying NOT NULL,
        "status" "jobs_status_enum" NOT NULL DEFAULT 'pending',
        "format" "jobs_format_enum",
        "raw_key" character varying NOT NULL,
        "original_filename" character varying,
        "error_message" text,
        "export_key_csv" character varying,
        "export_key_xlsx" character varying,
        "export_key_qbo" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_jobs" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "jobs"`);
    await queryRunner.query(`DROP TYPE "jobs_format_enum"`);
    await queryRunner.query(`DROP TYPE "jobs_status_enum"`);
  }
}
