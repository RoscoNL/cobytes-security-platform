import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.model';
import { CartItem } from './cartItem.model';

export enum CartStatus {
  ACTIVE = 'active',
  ABANDONED = 'abandoned',
  CONVERTED = 'converted',
}

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  session_id: string; // For guest users

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  user: User;

  @Column({
    type: 'enum',
    enum: CartStatus,
    default: CartStatus.ACTIVE,
  })
  status: CartStatus;

  @OneToMany(() => CartItem, (cartItem) => cartItem.cart, { cascade: true })
  items: CartItem[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ nullable: true })
  coupon_code: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount_amount: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Method to calculate totals
  calculateTotals() {
    this.subtotal = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    this.tax = this.subtotal * 0.21; // 21% VAT
    this.total = this.subtotal + this.tax - this.discount_amount;
  }
}