import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_PRODUCT = 'free_product',
  FREE_SCAN = 'free_scan'
}

export enum CouponStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  DEPLETED = 'depleted',
  DISABLED = 'disabled'
}

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'enum', enum: CouponType })
  type: CouponType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  value: number; // Percentage (0-100) or fixed amount

  @Column({ type: 'json', nullable: true })
  applicable_products: number[]; // Product IDs this coupon applies to

  @Column({ type: 'json', nullable: true })
  applicable_scan_types: string[]; // Scan types for free scan coupons

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minimum_amount: number; // Minimum cart amount required

  @Column({ default: 1 })
  usage_limit: number; // Total number of times coupon can be used

  @Column({ default: 0 })
  usage_count: number; // Current usage count

  @Column({ default: 1 })
  usage_limit_per_user: number; // How many times a single user can use it

  @Column({ type: 'date', nullable: true })
  valid_from: Date;

  @Column({ type: 'date', nullable: true })
  valid_until: Date;

  @Column({ type: 'enum', enum: CouponStatus, default: CouponStatus.ACTIVE })
  status: CouponStatus;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Helper method to check if coupon is valid
  isValid(): boolean {
    const now = new Date();
    
    // Check status
    if (this.status !== CouponStatus.ACTIVE) return false;
    
    // Check dates
    if (this.valid_from && now < this.valid_from) return false;
    if (this.valid_until && now > this.valid_until) return false;
    
    // Check usage limit
    if (this.usage_count >= this.usage_limit) return false;
    
    return true;
  }
}