// src/services/paymentService.ts
import Stripe from "stripe";
import { CreateOrderDto } from "../dtos/order/CreateOrderDto";
import { OrderService } from "./OrderService";
import { AppDataSource } from "../config/database";
import { Payment } from "../entities/Payment";
import { Order } from "../entities/Order";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-11-17.clover",
});

const orderService = new OrderService();

/**
 * ✅ PAIEMENT PAR CARTE
 * Crée une commande complète + PaymentIntent Stripe
 */
export async function createPaymentIntent(createOrderDto: CreateOrderDto) {
  console.log("💳 Création PaymentIntent pour commande...");
  
  try {
    // 1️⃣ CRÉER LA COMMANDE COMPLÈTE (avec items, stock, etc.)
    const order = await orderService.createOrder(createOrderDto);
    console.log(`✅ Commande créée: #${order.id_order}, Total: ${order.total}€`);

    // 2️⃣ CRÉER LE PAYMENTINTENT STRIPE
    const amountInCents = Math.round(order.total * 100);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "eur",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId: order.id_order.toString(),
        userId: createOrderDto.id_user_account.toString(),
        email: createOrderDto.email,
      },
      receipt_email: createOrderDto.email,
    });

    console.log(`✅ PaymentIntent créé: ${paymentIntent.id}`);

    // 3️⃣ CRÉER L'ENREGISTREMENT PAYMENT
    const paymentRepo = AppDataSource.getRepository(Payment);
    const payment = paymentRepo.create({
      id_order: order.id_order,
      amount: order.total,
      payment_method: "CARD",
      payment_status: "PENDING",
      transaction_id: paymentIntent.id,
    });
    await paymentRepo.save(payment);

    console.log(`✅ Payment enregistré: #${payment.id_payment}`);

    return {
      clientSecret: paymentIntent.client_secret,
      orderId: order.id_order,
    };

  } catch (error: any) {
    console.error("❌ Erreur createPaymentIntent:", error.message);
    throw error;
  }
}

// src/services/paymentService.ts

/**
 * ✅ PAIEMENT PAR VIREMENT BANCAIRE
 */
export async function createBankPayment(createOrderDto: CreateOrderDto) {
  console.log("🏦 Création commande virement bancaire...");
  
  try {
    // 1️⃣ CRÉER LA COMMANDE COMPLÈTE
    const order = await orderService.createOrder(createOrderDto);
    console.log(`✅ Commande créée: #${order.id_order}, Total: ${order.total}€`);

    // 2️⃣ CRÉER L'ENREGISTREMENT PAYMENT
    const paymentRepo = AppDataSource.getRepository(Payment);
    const payment = paymentRepo.create({
      id_order: order.id_order,
      amount: order.total, // ✅ Utiliser total_amount
      payment_method: "BANK_TRANSFER",
      payment_status: "PENDING",
      transaction_id: null,
    });
    await paymentRepo.save(payment);

    console.log(`✅ Payment enregistré: #${payment.id_payment}`);

    // ✅ RETOURNER LA COMMANDE COMPLÈTE
    return order; // Retourne l'objet Order complet

  } catch (error: any) {
    console.error("❌ Erreur createBankPayment:", error.message);
    throw error;
  }
}

/**
 * ✅ CONFIRMER UN PAIEMENT STRIPE
 * Met à jour le statut après succès
 */
export async function confirmPayment(paymentIntentId: string) {
  console.log("🔍 Confirmation paiement:", paymentIntentId);
  
  try {
    // 1️⃣ RÉCUPÉRER LE PAYMENTINTENT
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (intent.status !== "succeeded") {
      throw new Error(`Paiement non réussi: ${intent.status}`);
    }

    // 2️⃣ RÉCUPÉRER LE PAYMENT
    const paymentRepo = AppDataSource.getRepository(Payment);
    const payment = await paymentRepo.findOne({
      where: { transaction_id: paymentIntentId },
      relations: ["order"],
    });

    if (!payment) {
      throw new Error(`Payment introuvable pour transaction ${paymentIntentId}`);
    }

    // 3️⃣ METTRE À JOUR LES STATUTS
    payment.payment_status = "COMPLETED";
    await paymentRepo.save(payment);

    const orderRepo = AppDataSource.getRepository(Order);
    await orderRepo.update(
      { id_order: payment.id_order },
      { status: "CONFIRMED" }
    );

    console.log(`✅ Paiement confirmé pour commande #${payment.id_order}`);

    return {
      success: true,
      orderId: payment.id_order,
      paymentId: payment.id_payment,
    };

  } catch (error: any) {
    console.error("❌ Erreur confirmPayment:", error.message);
    throw error;
  }
}
