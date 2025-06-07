import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Scan } from './scan.model';
import { ScheduledScan } from './scheduledScan.model';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'varchar', length: 50, default: 'user' })
  role: string;

  @OneToMany(() => Scan, scan => scan.user)
  scans: Scan[];

  @OneToMany(() => ScheduledScan, scheduledScan => scheduledScan.user)
  scheduledScans: ScheduledScan[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}