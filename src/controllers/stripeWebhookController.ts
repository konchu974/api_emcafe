import { Request, Response } from "express";
import Stripe from "stripe";
import { AppDataSource } from "../config/database";
import { Payment } from "../entities/Payment";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-11-17.clover",
});

export const stripeWebhook = async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;

    let event;

    try {
        // req.body MUST BE RAW BUFFER
        event = stripe.webhooks.constructEvent(
            req.body,                        // RAW body
            sig,
            process.env.STRIPE_WEBHOOK_SECRET! // ⚠️ ensure this matches .env
        );
    } catch (err: any) {
        console.error("❌ Webhook signature error:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log("🔔 Stripe webhook received:", event.type);

    switch (event.type) {
        case "payment_intent.succeeded": {
            const intent = event.data.object as Stripe.PaymentIntent;
            console.log("✅ Payment succeeded:", intent.id);

            const paymentRepo = AppDataSource.getRepository(Payment);

            const payment = await paymentRepo.findOne({
                where: { transaction_id: intent.id },
            });

            if (payment) {
                payment.payment_status = "PAID";
                payment.paid_at = new Date();
                await paymentRepo.save(payment);
                console.log("💾 Payment updated in DB");
            }

            break;
        }

        case "payment_intent.payment_failed": {
            console.log("❌ Payment failed");
            break;
        }
    }

    // MUST return 200 for Stripe to accept the delivery
    res.status(200).json({ received: true });
};
