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
    // IMPORTANT: req.body must be raw buffer, NOT parsed JSON
    event = stripe.webhooks.constructEvent(
      req.body,               
      sig as string,
      webhookSecret as string
    );
  } catch (err: any) {
    console.error("❌ Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`🔔 Webhook received: ${event.type}`);

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent: any = event.data.object;

const orderId = paymentIntent.metadata?.orderId;

if (!orderId) {
  console.log("❌ No orderId in metadata");
  return res.status(200).send({ received: true });  
}


    console.log("💳 Payment succeeded for order:", orderId);

    const orderRepo = AppDataSource.getRepository(Order);
    const paymentRepo = AppDataSource.getRepository(Payment);

    await orderRepo.update(orderId, { status: "PAID" });

    await paymentRepo.update(
      { transaction_id: paymentIntent.id },
      { payment_status: "PAID" }
    );

    console.log("✅ Order + Payment updated to PAID");
  }

  return res.status(200).send({ received: true });
};
