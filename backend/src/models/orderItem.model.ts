import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.model';
import { Product } from './product.model';
import { Scan } from './scan.model';

export enum OrderItemStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  USED = 'used',
  EXPIRED = 'expired',
}

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn()
  order: Order;

  @ManyToOne(() => Product, (product) => product.order_items)
  @JoinColumn()
  product: Product;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({
    type: 'enum',
    enum: OrderItemStatus,
    default: OrderItemStatus.PENDING,
  })
  status: OrderItemStatus;

  @Column({ type: 'json', nullable: true })
  configuration: any; // Scan configuration from cart

  @Column({ type: 'int', default: 0 })
  scans_used: number;

  @Column({ type: 'int', nullable: true })
  scans_total: number; // Total scans available from this item

  @OneToMany(() => Scan, (scan) => scan.order_item)
  scans: Scan[];

  @Column({ nullable: true })
  valid_until: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}