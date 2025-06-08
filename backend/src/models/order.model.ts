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
import { OrderItem } from './orderItem.model';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  MULTISAFEPAY = 'multisafepay',
  BANK_TRANSFER = 'bank_transfer',
  INVOICE = 'invoice',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  order_number: string;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  items: OrderItem[];

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  payment_status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
  })
  payment_method: PaymentMethod;

  @Column({ nullable: true })
  payment_intent_id: string; // Stripe payment intent

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  tax: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ nullable: true })
  coupon_code: string;

  // Billing information
  @Column()
  billing_name: string;

  @Column()
  billing_email: string;

  @Column({ nullable: true })
  billing_company: string;

  @Column()
  billing_address: string;

  @Column()
  billing_city: string;

  @Column()
  billing_postal_code: string;

  @Column()
  billing_country: string;

  @Column({ nullable: true })
  billing_vat_number: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true })
  paid_at: Date;

  @Column({ nullable: true })
  completed_at: Date;
}