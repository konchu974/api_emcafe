// src/entities/Order.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { OrderItem } from './OrderItem';
import { Payment } from './Payment';
import { UserAccount } from './UserAccount';

@Entity({ name: 'order' }) // ou 'orders' si tu veux éviter le mot réservé
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id_order!: string;

  @Column({ type: 'char', length: 36 })
  id_user_account!: string;

  @ManyToOne(() => UserAccount, (user) => user.orders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_user_account' })
  user!: UserAccount;

  @Column({ type: 'varchar', length: 50, nullable: true, default: 'PENDING' })
  status!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  total!: number;

  // ==================== DELIVERY INFO ====================
  @Column({ type: 'text', nullable: true })
  delivery_address?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  delivery_city?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  delivery_postal_code?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  delivery_phone?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  delivery_country?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email?: string;

  // ==================== SENDCLOUD ====================
  @Column({ type: 'int', nullable: true })
  sendcloud_parcel_id?: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  tracking_number?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tracking_url?: string;

  @Column({ type: 'text', nullable: true })
  label_url?: string;

  // ==================== RELAY ====================
  @Column({ type: 'boolean', default: false })
  is_relay_delivery!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  relay_point_id?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  relay_point_name?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  relay_carrier?: string;

  // ==================== TIMESTAMPS ====================
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ 
    type: 'timestamp', 
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP'
  })
  updated_at!: Date;

  // ==================== RELATIONS ====================
  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  orderItems!: OrderItem[];

  @OneToOne(() => Payment, (payment) => payment.order, { nullable: true })
  payment?: Payment;
}
