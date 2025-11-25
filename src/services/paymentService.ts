import Stripe from "stripe";
import { AppDataSource } from "../config/database";
import { Order } from "../entities/Order";
import { Payment } from "../entities/Payment";
import { ApiVersion } from "stripe/types/apiVersion";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-11-17.clover",
})
   

export const paymentService = {
    // for card payment
    async createPaymentIntent(amount: number) {
        const intent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: "eur",
            payment_method_types: ["card"],
        });

        return intent.client_secret;
    },

    // for bank transfer 
    async createBankPayment(userId: string, amount: number) {
        const orderRepo = AppDataSource.getRepository(Order);
        const paymentRepo = AppDataSource.getRepository(Payment);

        // create order (pending)
        const order = orderRepo.create({
            id_user_account: userId,
            status: "PENDING",
            total: amount,
        });
        await orderRepo.save(order);

        // create payment record
        const payment = paymentRepo.create({
            id_order: order.id_order,
            amount,
            payment_method: "BANK_TRANSFER",
            payment_status: "PENDING",
        });
        await paymentRepo.save(payment);

        return {
            message: "Bank transfer created",
            orderId: order.id_order,
            paymentId: payment.id_payment,
        };
    },
};