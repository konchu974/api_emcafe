import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Order } from "./Order";

@Entity("payment")
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  id_payment!: string;

  @Column({ type: "char", length: 36 })
  id_order!: string;

  @OneToOne(() => Order, (order) => order.payment, { onDelete: "CASCADE" })
  @JoinColumn({ name: "id_order" })
  order!: Order;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

  @Column({ length: 50 })
  payment_method!: string; // "CARD" | "BANK_TRANSFER"

  @Column({ length: 50, default: "PENDING" })
  payment_status!: string; // "PENDING" | "PAID" | "FAILED"

  @Column({ type: "varchar", length: 255, nullable: true })
  transaction_id!: string | null;

  @Column({ type: "timestamp", nullable: true })
  paid_at!: Date | null;

  @CreateDateColumn()
  created_at!: Date;


}
