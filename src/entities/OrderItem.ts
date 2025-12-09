// src/entities/OrderItem.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Order } from './Order';
import { Product } from './Product';

@Entity({ name: 'order_item' })
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id_order_item!: string;

  @Column({ type: 'char', length: 36 })
  id_order!: string;

  @Column({ type: 'char', length: 36 })
  id_product!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_price!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal!: number;

  // ✅ Relations
  @ManyToOne(() => Order, (order) => order.orderItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_order' })
  order!: Order;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'id_product' })
  product!: Product;
}
