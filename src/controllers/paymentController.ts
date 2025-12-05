// src/controllers/paymentController.ts
import { Request, Response } from "express";
import * as paymentService from "../services/paymentService";
import Stripe from "stripe";
import { sendOrderEmails } from "../services/emailService";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-11-17.clover",
});

// ================= CARD PAYMENT =================
export const createCardPayment = async (req: Request, res: Response) => {
  try {
    const { userId, amount, delivery_address, delivery_city, delivery_postal_code } =
      req.body;

    if (!userId || !amount) {
      return res.status(400).json({ message: "Missing userId or amount" });
    }

    if (!delivery_address || !delivery_city || !delivery_postal_code) {
      return res
        .status(400)
        .json({ message: "Missing delivery information" });
    }

    // Create order + paymentIntent
    const { clientSecret, orderId } =
      await paymentService.createPaymentIntent(req.body);

    return res.status(200).json({ clientSecret, orderId });
  } catch (error: any) {
    console.error("Stripe create error:", error.message);
    return res.status(500).json({
      message: "Stripe error",
      error: error.message,
    });
  }
};

// ================= BANK TRANSFER =================
export const createBankTransfer = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      amount,
      delivery_address,
      delivery_city,
      delivery_postal_code,
      delivery_country,
      delivery_phone,
      email,
    } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    if (!delivery_address || !delivery_city || !delivery_postal_code) {
      return res
        .status(400)
        .json({ message: "Missing delivery information" });
    }

    const bankPayment = await paymentService.createBankPayment(
      userId,
      amount,
      delivery_address,
      delivery_city,
      delivery_postal_code,
      delivery_country,
      delivery_phone,
      email
    );

    // Send email immediately
    sendOrderEmails({
      customerEmail: email,
      orderId: bankPayment.orderId,
      amount,
      paymentMethod: "VIREMENT BANCAIRE",
    }).catch((err) => console.error("❌ Email error (bank):", err.message));

    return res.status(201).json(bankPayment);
  } catch (error: any) {
    console.error("Bank transfer error:", error.message);
    return res.status(500).json({
      message: "Bank transfer error",
      error: error.message,
    });
  }
};

// ================= CONFIRM PAYMENT =================
export const confirmStripePayment = async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ message: "Missing paymentIntentId" });
    }

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (intent.status !== "succeeded") {
      return res.status(400).json({ message: "Payment not completed yet" });
    }

    return res.status(200).json({
      message: "Payment confirmed",
      paymentIntentId: intent.id,
    });
  } catch (error: any) {
    console.error("Stripe confirm error:", error.message);
    return res.status(500).json({
      message: "Stripe confirm error",
      error: error.message,
    });
  }
};
