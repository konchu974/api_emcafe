import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { UserAccount } from "./UserAccount";
import { OrderItem } from "./OrderItem";
import { Payment } from "./Payment";

@Entity("order")
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id_order!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @Column({ length: 50, default: "PENDING" })
  status!: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  total!: number;

  @Column({ type: "char", length: 36 })
  id_user_account!: string;

  @ManyToOne(() => UserAccount, (user) => user.orders, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_user_account" })
  user!: UserAccount;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items!: OrderItem[];

  @OneToOne(() => Payment, (payment) => payment.order)
  payment!: Payment;

  // 🌍 DELIVERY FIELDS (missing before!)
  @Column({ type: "text", nullable: true })
  delivery_address!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  delivery_city!: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  delivery_postal_code!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  delivery_country!: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  delivery_phone!: string;
}

