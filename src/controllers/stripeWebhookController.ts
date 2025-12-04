import { Request, Response } from "express";
import Stripe from "stripe";
import { AppDataSource } from "../config/database";
import { Order } from "../entities/Order";
import { Payment } from "../entities/Payment";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-11-17.clover",
});

export const stripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return res.status(400).send("Missing webhook signature");
  }

  let event;

  try {
    // req.body MUST BE RAW BUFFER
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    );
  } catch (err: any) {
    console.error("❌ Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("🔔 Stripe Event:", event.type);

  /* -------------------------------------------
     PAYMENT INTENT SUCCEEDED
  -------------------------------------------- */
  if (event.type === "payment_intent.succeeded") {
    const intent: any = event.data.object;
    const orderId = intent.metadata?.orderId;

    if (!orderId) {
      console.log("❌ Missing orderId in metadata");
      return res.json({ received: true });
    }

    console.log(`💳 Payment succeeded → order ${orderId}`);

    const orderRepo = AppDataSource.getRepository(Order);
    const paymentRepo = AppDataSource.getRepository(Payment);

    // Update order status
    await orderRepo.update(orderId, { status: "PAID" });

    // Update payment status
    await paymentRepo.update(
      { transaction_id: intent.id },
      { payment_status: "PAID" }
    );

    console.log("✅ Order + Payment marked as PAID");
  }

  return res.json({ received: true });
};
