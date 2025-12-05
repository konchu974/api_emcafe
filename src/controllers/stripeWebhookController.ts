import { Request, Response } from "express";
import Stripe from "stripe";
import { AppDataSource } from "../config/database";
import { Order } from "../entities/Order";
import { Payment } from "../entities/Payment";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-11-17.clover",
});

export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      webhookSecret as string
    );
  } catch (err: any) {
    console.error("❌ Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`🔔 Stripe Event: ${event.type}`);

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent: any = event.data.object;

    // ⚠ CLOVER: metadata will ALWAYS be empty
    const transactionId = paymentIntent.id;

    console.log("🔎 Looking for payment with tx:", transactionId);

    const paymentRepo = AppDataSource.getRepository(Payment);
    const orderRepo = AppDataSource.getRepository(Order);

    // Find payment using transaction_id
    const payment = await paymentRepo.findOne({
      where: { transaction_id: transactionId },
    });

    if (!payment) {
      console.log("❌ No payment found for tx", transactionId);
      return res.status(200).send({ received: true });
    }

    // Update status
    await paymentRepo.update(payment.id_payment, {
      payment_status: "PAID",
    });

    await orderRepo.update(payment.id_order, {
      status: "PAID",
    });

    console.log("✅ Order + Payment marked PAID !");
  }

  return res.status(200).send({ received: true });
};
