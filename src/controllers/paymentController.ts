// src/controllers/paymentController.ts
import { Request, Response } from "express";
import * as paymentService from "../services/paymentService";
import Stripe from "stripe";
import { sendOrderEmails } from "../services/emailService";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateOrderDto } from "../dtos/order/CreateOrderDto";
import { AppDataSource } from "../config/database";
import { ProductVariant } from "../entities/ProductVariant";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-11-17.clover",
});

// ================= HELPER: RÉCUPÉRER LES IDs PRODUITS =================
async function enrichItemsWithProductIds(items: any[]): Promise<any[]> {
  const variantRepo = AppDataSource.getRepository(ProductVariant);
  
  return await Promise.all(
    items.map(async (item: any) => {
      const variantId = item.id_product_variant || item.variantId || item.id_variant;
      
      if (!variantId) {
        throw new Error(`Variant ID manquant pour l'item: ${JSON.stringify(item)}`);
      }

      // ✅ CORRECTION: Utiliser "idVariant" (propriété TypeScript)
      const variant = await variantRepo.findOne({
        where: { idVariant: variantId },
        relations: ["product"],
      });

      if (!variant) {
        throw new Error(`Variant ${variantId} introuvable`);
      }

      if (!variant.product) {
        throw new Error(`Produit non trouvé pour le variant ${variantId}`);
      }

      return {
        id_product: variant.product.id_product,   
        id_variant: variant.idVariant,    
        quantity: item.quantity,
        unit_price: item.price || item.unit_price,
      };
    })
  );
}

// ================= CARD PAYMENT =================
export const createCardPayment = async (req: Request, res: Response) => {
  try {
    console.log("💳 Requête paiement carte reçue:", JSON.stringify(req.body, null, 2));

    // ✅ ENRICHIR LES ITEMS AVEC LES IDs PRODUITS
    const enrichedItems = await enrichItemsWithProductIds(req.body.items || []);
    console.log("✅ Items enrichis:", enrichedItems);

    // ✅ TRANSFORMATION EN DTO
    const createOrderDto = plainToInstance(CreateOrderDto, {
      id_user_account: req.body.userId,
      delivery_first_name: req.body.delivery_first_name,
      delivery_last_name: req.body.delivery_last_name,
      delivery_address: req.body.delivery_address,
      delivery_address2: req.body.delivery_address2 || undefined,
      delivery_city: req.body.delivery_city,
      delivery_postal_code: req.body.delivery_postal_code,
      delivery_country: req.body.delivery_country || "France",
      delivery_phone: req.body.delivery_phone,
      email: req.body.email,

      // Point relais
      is_relay_delivery: req.body.is_relay_delivery || false,
      relay_point_id: req.body.relay_point_id ? String(req.body.relay_point_id) : undefined,
      relay_point_name: req.body.relay_point_name || undefined,
      relay_carrier: req.body.relay_carrier || undefined,
      relay_phone: req.body.relay_phone || undefined,
      relay_email: req.body.relay_email || undefined,

      // Items enrichis
      items: enrichedItems,

      // Montant livraison
      delivery_cost: req.body.delivery_cost || 0,
      notes: req.body.notes || undefined,
    });

    // ✅ VALIDATION
    const errors = await validate(createOrderDto);
    if (errors.length > 0) {
      console.error("❌ Erreurs de validation:", errors);
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: errors.map(err => ({
          property: err.property,
          constraints: err.constraints,
          value: err.value
        }))
      });
    }

    console.log("✅ DTO validé:", createOrderDto);

    // ✅ CRÉER PAYMENTINTENT + COMMANDE
    const { clientSecret, orderId } = await paymentService.createPaymentIntent(createOrderDto);

    return res.status(200).json({ 
      success: true,
      clientSecret, 
      orderId 
    });

  } catch (error: any) {
    console.error("❌ Erreur création paiement carte:", error.message);
    console.error("Stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: error.message || "Erreur lors de la création du paiement",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// ================= BANK TRANSFER =================
export const createBankTransfer = async (req: Request, res: Response) => {
  try {
    console.log("🏦 Requête virement bancaire reçue:", JSON.stringify(req.body, null, 2));

    // ✅ ENRICHIR LES ITEMS AVEC LES IDs PRODUITS
    const enrichedItems = await enrichItemsWithProductIds(req.body.items || []);
    console.log("✅ Items enrichis:", enrichedItems);

    // ✅ TRANSFORMATION EN DTO
    const createOrderDto = plainToInstance(CreateOrderDto, {
      id_user_account: req.body.userId,
      delivery_first_name: req.body.delivery_first_name,
      delivery_last_name: req.body.delivery_last_name,
      delivery_address: req.body.delivery_address,
      delivery_address2: req.body.delivery_address2 || undefined,
      delivery_city: req.body.delivery_city,
      delivery_postal_code: req.body.delivery_postal_code,
      delivery_country: req.body.delivery_country || "France",
      delivery_phone: req.body.delivery_phone,
      email: req.body.email,

      // Point relais
      is_relay_delivery: req.body.is_relay_delivery || false,
      relay_point_id: req.body.relay_point_id ? String(req.body.relay_point_id) : undefined,
      relay_point_name: req.body.relay_point_name || undefined,
      relay_carrier: req.body.relay_carrier || undefined,
      relay_phone: req.body.relay_phone || undefined,
      relay_email: req.body.relay_email || undefined,

      // Items enrichis
      items: enrichedItems,

      // Montant livraison
      delivery_cost: req.body.delivery_cost || 0,
      notes: req.body.notes || undefined,
    });

    // ✅ VALIDATION
    const errors = await validate(createOrderDto);
    if (errors.length > 0) {
      console.error("❌ Erreurs de validation:", errors);
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: errors.map(err => ({
          property: err.property,
          constraints: err.constraints,
          value: err.value
        }))
      });
    }

    console.log("✅ DTO validé:", createOrderDto);

    // ✅ CRÉER LA COMMANDE
    const order = await paymentService.createBankPayment(createOrderDto);

    // ✅ ENVOYER L'EMAIL
    sendOrderEmails({
      customerEmail: createOrderDto.email,
      orderId: order.id_order,
      amount: order.total,
      paymentMethod: "VIREMENT BANCAIRE",
    }).catch((err) => console.error("❌ Erreur envoi email:", err.message));

    return res.status(201).json({
      success: true,
      orderId: order.id_order,
      message: "Commande créée en attente de virement",
    });

  } catch (error: any) {
    console.error("❌ Erreur virement bancaire:", error.message);
    console.error("Stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: error.message || "Erreur lors de la création de la commande",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// ================= CONFIRM PAYMENT =================
export const confirmStripePayment = async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ 
        success: false,
        message: "paymentIntentId manquant" 
      });
    }

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (intent.status !== "succeeded") {
      return res.status(400).json({ 
        success: false,
        message: "Paiement non finalisé",
        status: intent.status
      });
    }

    return res.status(200).json({
      success: true,
      message: "Paiement confirmé",
      paymentIntentId: intent.id,
      orderId: intent.metadata.orderId,
    });

  } catch (error: any) {
    console.error("❌ Erreur confirmation Stripe:", error.message);
    return res.status(500).json({
      success: false,
      message: "Erreur lors de la confirmation du paiement",
      error: error.message,
    });
  }
};
