// src/services/paymentService.ts
import Stripe from "stripe";
import { AppDataSource } from "../config/database";
import { Order } from "../entities/Order";
import { Payment } from "../entities/Payment";
import { DeepPartial } from "typeorm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-11-17.clover",
});

/**
 * CARD PAYMENT
 */
export async function createPaymentIntent(data: any) {
  const {
    userId,
    amount,
    delivery_address,
    delivery_city,
    delivery_postal_code,
    delivery_country,
    delivery_phone,
    email,
  } = data;

  const orderRepo = AppDataSource.getRepository(Order);
  const paymentRepo = AppDataSource.getRepository(Payment);

  // 1. Create order
  const order = orderRepo.create({
    id_user_account: userId,
    status: "PENDING",
    total: amount,
    delivery_address,
    delivery_city,
    delivery_postal_code,
    delivery_country,
    delivery_phone,
    email: email, // ✅ FIXED
  } as DeepPartial<Order>);
  await orderRepo.save(order);

  // 2. PaymentIntent (Clover-compatible)
  const intent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: "eur",

    automatic_payment_methods: {
      enabled: true,
    },

    metadata: {
      orderId: order.id_order, // must remain string
    },
  });

  // 3. Payment row
  const payment = paymentRepo.create({
    id_order: order.id_order,
    amount,
    payment_method: "CARD",
    payment_status: "PENDING",
    transaction_id: intent.id,
  } as DeepPartial<Payment>);
  await paymentRepo.save(payment);

  return {
    clientSecret: intent.client_secret,
    orderId: order.id_order,
  };
}

/**
 * BANK TRANSFER
 */
export async function createBankPayment(
  userId: string,
  amount: number,
  delivery_address: string,
  delivery_city: string,
  delivery_postal_code: string,
  delivery_country: string,
  delivery_phone: string,
  email?: string
) {
  const orderRepo = AppDataSource.getRepository(Order);
  const paymentRepo = AppDataSource.getRepository(Payment);

  const order = orderRepo.create({
    id_user_account: userId,
    status: "PENDING",
    total: amount,
    delivery_address,
    delivery_city,
    delivery_postal_code,
    delivery_country,
    delivery_phone,
    email: email ?? null, 
  } as DeepPartial<Order>);
  await orderRepo.save(order);

  const payment = paymentRepo.create({
    id_order: order.id_order,
    amount,
    payment_method: "BANK_TRANSFER",
    payment_status: "PENDING",
  } as DeepPartial<Payment>);
  await paymentRepo.save(payment);

  return {
    message: "Bank transfer created",
    orderId: order.id_order,
    paymentId: payment.id_payment,
  };
}
