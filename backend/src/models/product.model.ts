import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrderItem } from './orderItem.model';
import { CartItem } from './cartItem.model';

export enum ProductCategory {
  SECURITY_SCAN = 'security_scan',
  BUNDLE = 'bundle',
  SUBSCRIPTION = 'subscription',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({
    type: 'enum',
    enum: ProductCategory,
    default: ProductCategory.SECURITY_SCAN,
  })
  category: ProductCategory;

  @Column({ type: 'json', nullable: true })
  features: string[];

  @Column({ type: 'json', nullable: true })
  scan_types: string[]; // Which scan types this product includes

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_featured: boolean;

  @Column({ nullable: true })
  stripe_price_id: string; // For Stripe integration

  @Column({ type: 'int', nullable: true })
  scan_credits: number; // How many scans this product provides

  @Column({ type: 'int', nullable: true })
  validity_days: number; // How long the scans are valid

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  order_items: OrderItem[];

  @OneToMany(() => CartItem, (cartItem) => cartItem.product)
  cart_items: CartItem[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}