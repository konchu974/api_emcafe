// src/controllers/stripeWebhookController.ts
import { Request, Response } from "express";
import Stripe from "stripe";
import { AppDataSource } from "../config/database";
import { Order } from "../entities/Order";
import { Payment } from "../entities/Payment";
import { sendOrderEmails } from "../services/emailService";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-11-17.clover",
});

export const stripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

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

  const orderRepo = AppDataSource.getRepository(Order);
  const paymentRepo = AppDataSource.getRepository(Payment);

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata?.orderId;

    if (!orderId) {
      console.log("❌ Missing orderId in metadata");
      return res.status(200).send({ received: true });
    }

    console.log("💳 Payment succeeded for order:", orderId);

    // Update DB
    await orderRepo.update(orderId, { status: "PAID" });

    await paymentRepo.update(
      { transaction_id: paymentIntent.id },
      { payment_status: "PAID" }
    );

    // Fetch order (email stored here)
    const order = await orderRepo.findOne({
      where: { id_order: orderId },
    });

    const customerEmail = order?.email ?? null;
    const amount =
      (paymentIntent.amount_received ?? paymentIntent.amount) / 100;

    // Send both emails
    sendOrderEmails({
      customerEmail,
      orderId,
      amount,
      paymentMethod: "CARTE BANCAIRE",
    }).catch((err) =>
      console.error("❌ Email error (webhook card):", err.message)
    );

    console.log("✅ Order + Payment updated to PAID");
  }

  return res.status(200).send({ received: true });
};
