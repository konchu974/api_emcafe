import Stripe from "stripe";
import { AppDataSource } from "../config/database";
import { Order } from "../entities/Order";
import { Payment } from "../entities/Payment";
import { DeepPartial } from "typeorm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-11-17.clover",
})
   

export async function createPaymentIntent(data: any) {
    const {
        userId,
        amount,
        delivery_address,
        delivery_city,
        delivery_postal_code,
        delivery_country,
        delivery_phone
    } = data;

    const orderRepo = AppDataSource.getRepository(Order);
    const paymentRepo = AppDataSource.getRepository(Payment);

    // 1. Create order in DB
    const order = orderRepo.create({
        id_user_account: userId,
        status: "PENDING",
        total: amount,
        delivery_address,
        delivery_city,
        delivery_postal_code,
        delivery_country,
        delivery_phone
    } as DeepPartial<Order>);
    await orderRepo.save(order);

    // 2. Create Stripe PaymentIntent
    const intent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: "eur",
        payment_method_types: ["card"],
        metadata: {
            orderId: order.id_order.toString(),
        },
    });

    // 3. Create payment record
    const payment = paymentRepo.create({
        id_order: order.id_order,
        amount,
        payment_method: "CARD",
        payment_status: "PENDING",
        transaction_id: intent.id,
    } as DeepPartial<Payment>);
    await paymentRepo.save(payment);

    return intent.client_secret;
}


// for bank transfer 
export async function createBankPayment(
    userId: string,
    amount: number,
    delivery_address: string,
    delivery_city: string,
    delivery_postal_code: string,
    delivery_country: string,
    delivery_phone: string
) {
    const orderRepo = AppDataSource.getRepository(Order);
    const paymentRepo = AppDataSource.getRepository(Payment);

    // Create order (pending)
    const order = orderRepo.create({
        id_user_account: userId,
        status: "PENDING",
        total: amount,
        delivery_address,
        delivery_city,
        delivery_postal_code,
        delivery_country,
        delivery_phone
    } as DeepPartial<Order>);
    await orderRepo.save(order);

    // Create payment record
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
