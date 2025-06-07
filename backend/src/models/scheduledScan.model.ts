import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.model';
import { ScanType } from './scan.model';

export enum ScheduleFrequency {
  ONCE = 'once',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

@Entity('scheduled_scans')
export class ScheduledScan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  target: string;

  @Column({ type: 'varchar', length: 50 })
  scan_type: string;

  @Column({ type: 'jsonb', nullable: true })
  parameters: Record<string, any>;

  @Column({ type: 'varchar', length: 20 })
  frequency: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cron_expression: string;

  @Column({ type: 'timestamp' })
  next_run_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_run_at: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'int', default: 0 })
  run_count: number;

  @Column({ type: 'int', nullable: true })
  max_runs: number;

  @ManyToOne(() => User, user => user.scheduledScans)
  user: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}