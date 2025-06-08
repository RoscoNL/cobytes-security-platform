import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.model';
import { Coupon } from './coupon.model';
import { Order } from './order.model';

@Entity('coupon_usage')
export class CouponUsage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Coupon)
  @JoinColumn({ name: 'coupon_id' })
  coupon: Coupon;

  @Column()
  coupon_id: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  user_id: number;

  @Column({ nullable: true })
  session_id: string; // For guest users

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ nullable: true })
  order_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discount_amount: number;

  @CreateDateColumn()
  used_at: Date;
}