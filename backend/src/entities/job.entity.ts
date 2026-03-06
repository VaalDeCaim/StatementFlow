import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum JobFormat {
  MT940 = 'mt940',
  CAMT053 = 'camt053',
}

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.PENDING,
  })
  status: JobStatus;

  @Column({
    type: 'enum',
    enum: JobFormat,
    nullable: true,
  })
  format: JobFormat | null;

  @Column({ name: 'raw_key' })
  rawKey: string;

  @Column({ name: 'original_filename', nullable: true })
  originalFilename: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'export_key_csv', nullable: true })
  exportKeyCsv: string | null;

  @Column({ name: 'export_key_xlsx', nullable: true })
  exportKeyXlsx: string | null;

  @Column({ name: 'export_key_qbo', nullable: true })
  exportKeyQbo: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
