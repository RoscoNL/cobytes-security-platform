import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Scan } from './scan.model';

export enum ResultSeverity {
  INFO = 'info',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

@Entity('scan_results')
export class ScanResult {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Scan, scan => scan.results)
  scan: Scan;

  @Column({ type: 'varchar', length: 255 })
  type: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ResultSeverity, default: ResultSeverity.INFO })
  severity: ResultSeverity;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  affected_component: string;

  @Column({ type: 'text', nullable: true })
  recommendation: string;

  @Column({ type: 'text', array: true, nullable: true })
  references: string[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  cve_id: string;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  cvss_score: number;

  @CreateDateColumn()
  created_at: Date;
}