// src/entities/Order.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  OneToOne
} from 'typeorm';
import { UserAccount } from './UserAccount';  
import { OrderItem } from './OrderItem';
import { Payment } from './Payment';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

@Entity({ name: 'order' })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id_order!: string;

  @Column({ type: 'char', length: 36 })
  id_user_account!: string;

  @ManyToOne(() => UserAccount, (user) => user.orders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_user_account' })
  user!: UserAccount;

  @Column({ type: 'varchar', length: 50, default: 'PENDING' })
  status!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  total!: number;

  @Column({ type: 'text', nullable: true })
  delivery_address?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  delivery_city?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  delivery_postal_code?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  delivery_phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ 
    type: 'timestamp', 
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP'
  })
  updated_at!: Date;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  orderItems!: OrderItem[];

  @OneToOne(() => Payment, (payment) => payment.order, { nullable: true })
  payment?: Payment;
}
