import { Request, Response } from "express";
import { paymentService } from "../services/paymentService";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-11-17.clover",
});

export const createCardPayment = async (req: Request, res: Response) => {
    try {
        const {amount} = req.body;

        if (!amount) {
            return res.status(400).json({message: "Missing amount"});
        }

        const clientSecret = await paymentService.createPaymentIntent(amount);

        return res.status(200).json({clientSecret});
    } catch (error: any) {
        console.error("Stripe create error:", error.message);
        return res.status(500).json({
            message:  "Stripe error",
            error: error.message,
        });
    }
};

export const createBankTransfer = async (req: Request, res: Response) => {
    try {
        const {userId, amount} = req.body;

        if (!userId || !amount) {
            return res.status(400).json({message: "Missing parameters"});
        }

        const bankPayment = await paymentService.createBankPayment(userId, amount);

        return res.status(201).json(bankPayment);
    } catch (error: any){
        console.error("Bank transfer error:", error.message);
        return res.status(500).json({
            message:  "Bank transfer error",
            error: error.message,
        });
    }
};


export const confirmStripePayment = async (req: Request, res: Response) => {
    try {
        const { paymentIntentId } = req.body;

        if (!paymentIntentId) {
            return res.status(400).json({ message: "Missing paymentIntentId"});
        }

        const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (intent.status !== "succeeded") {
            return res.status(400).json({message: "Payment not completed yet"});
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