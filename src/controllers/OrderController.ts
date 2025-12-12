// src/controllers/OrderController.ts

import { Request, Response } from 'express';
import { OrderService } from '../services/OrderService';
import { AuthRequest } from '../middlewares/authMiddleware';
import { CreateOrderDto } from '../dtos/order/CreateOrderDto';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export class OrderController {
  private orderService = new OrderService();

  /**
   * Créer une commande avec validation
   */
 // src/controllers/OrderController.ts

createOrder = async (req: Request, res: Response): Promise<Response> => {
  try {
    console.log('📥 Body brut reçu:', JSON.stringify(req.body, null, 2));

    // ✅ Vérifier que items existe et est un tableau
    if (!req.body.items || !Array.isArray(req.body.items)) {
      return res.status(400).json({
        success: false,
        message: 'items doit être un tableau non vide',
        received: req.body.items
      });
    }

    // ✅ Transformation avec class-transformer
    const createOrderDto = plainToInstance(CreateOrderDto, req.body, {
      enableImplicitConversion: true,
      excludeExtraneousValues: false,
      exposeDefaultValues: true
    });

    console.log('🔄 DTO transformé:', JSON.stringify(createOrderDto, null, 2));
    console.log('📦 Type de items:', typeof createOrderDto.items);
    console.log('📦 Items est un Array?', Array.isArray(createOrderDto.items));
    console.log('📦 Nombre d\'items:', createOrderDto.items?.length);
    
    if (createOrderDto.items && createOrderDto.items.length > 0) {
      console.log('📦 Premier item:', createOrderDto.items[0]);
      console.log('📦 Type du premier item:', createOrderDto.items[0].constructor.name);
    }

    // ✅ Validation avec class-validator
    const errors = await validate(createOrderDto, {
      whitelist: true,
      forbidNonWhitelisted: false,
      skipMissingProperties: false,
      validationError: { target: false, value: true }
    });

    if (errors.length > 0) {
      console.error('❌ Erreurs de validation détaillées:');
      
      errors.forEach(error => {
        console.error(`\n🔴 Propriété: ${error.property}`);
        console.error(`   Valeur reçue:`, error.value);
        console.error(`   Contraintes:`, error.constraints);
        
        if (error.children && error.children.length > 0) {
          console.error(`   Erreurs enfants:`);
          error.children.forEach((child, index) => {
            console.error(`     [${index}] ${child.property}:`, child.constraints);
            console.error(`         Valeur:`, child.value);
          });
        }
      });

      const formattedErrors = errors.map(error => ({
        property: error.property,
        value: error.value,
        constraints: error.constraints,
        children: error.children?.map(child => ({
          property: child.property,
          value: child.value,
          constraints: child.constraints
        }))
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation échouée',
        errors: formattedErrors
      });
    }

    console.log('✅ Validation réussie');

    // ✅ Créer la commande
    const order = await this.orderService.createOrder(createOrderDto);

    return res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data: order
    });

  } catch (error: any) {
    console.error('❌ Erreur création commande:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création de la commande',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


  /**
   * Récupérer toutes les commandes
   */
  getAllOrders = async (req: Request, res: Response) => {
    try {
      const orders = await this.orderService.getAllOrders();
      res.json({
        success: true,
        data: orders,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * Tracker une commande (public)
   */
  trackOrder = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId, postalCode } = req.body;

      if (!orderId || !postalCode) {
        res.status(400).json({
          success: false,
          message: 'ID de commande et code postal requis'
        });
        return;
      }

      const order = await this.orderService.trackOrder(orderId, postalCode);

      if (!order) {
        res.status(404).json({
          success: false,
          message: 'Commande introuvable ou code postal incorrect'
        });
        return;
      }

      res.json({ 
        success: true, 
        data: {
          id_order: order.id_order,
          status: order.status,
          created_at: order.created_at,
          tracking_number: order.tracking_number,
          tracking_url: order.tracking_url,
          delivery_city: order.delivery_city,
          is_relay_delivery: order.is_relay_delivery,
          relay_point_name: order.relay_point_name
        }
      });
    } catch (error: any) {
      console.error('❌ Erreur suivi commande:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors du suivi de la commande'
      });
    }
  };

  /**
   * Récupérer une commande par ID
   */
  getOrderById = async (req: Request, res: Response) => {
    try {
      const order = await this.orderService.getOrderById(req.params.id);
      res.json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * Récupérer les commandes de l'utilisateur connecté
   */
  getMyOrders = async (req: AuthRequest, res: Response) => {
    try {
      const orders = await this.orderService.getOrdersByUserId(req.user!.id);
      res.json({
        success: true,
        data: orders,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * Mettre à jour le statut d'une commande
   */
  updateOrderStatus = async (req: Request, res: Response) => {
    try {
      const order = await this.orderService.updateOrderStatus(req.params.id, req.body);
      res.json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * Supprimer une commande
   */
  deleteOrder = async (req: Request, res: Response) => {
    try {
      const result = await this.orderService.deleteOrder(req.params.id);
      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  };

  /**
   * Créer une étiquette SendCloud
   * POST /api/orders/:id/create-label
   */
  createLabel = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = req.params.id;

    // 1. Récupérer la commande avec tous les détails
    const order = await this.orderService.getOrderById(orderId);
    if (!order) {
      res.status(404).json({ success: false, error: 'Commande introuvable' });
      return;
    }

    // 2. Vérifier si une étiquette existe déjà
    if (order.sendcloud_parcel_id) {
      res.status(400).json({ 
        success: false,
        error: 'Une étiquette existe déjà pour cette commande',
        data: {
          parcel_id: order.sendcloud_parcel_id,
          tracking_number: order.tracking_number,
          tracking_url: order.tracking_url,
          label_url: order.label_url
        }
      });
      return;
    }

    // 3. Calculer le poids total (en grammes)
    const totalWeight = order.orderItems.reduce((sum, item) => {
      const formatString = item.variant?.format || '100';
      const format = parseInt(formatString.replace(/[^0-9]/g, ''), 10) || 100;
      return sum + format * item.quantity;
    }, 0);

    // 4. Préparer les données pour SendCloud
    const parcelData: any = {
      parcel: {
        order_number: order.id_order,
        name: `${order.user.first_name || ''} ${order.user.last_name || ''}`.trim() || order.email,
        address: order.delivery_address,
        city: order.delivery_city,
        postal_code: order.delivery_postal_code,
        country: order.delivery_country || 'FR',
        telephone: order.delivery_phone || '',
        email: order.email,
        weight: String(totalWeight),
        request_label: true,
        apply_shipping_rules: true,
        shipment: { id: 1 }, // ✅ Méthode d'expédition "standard" (hardcodée)
      },
    };

    // Ajouter point relais si nécessaire
    if (order.is_relay_delivery && order.relay_point_id) {
      parcelData.parcel.to_service_point = Number(order.relay_point_id);
    }

    // Ajouter les items
    parcelData.parcel.parcel_items = order.orderItems.map(item => ({
      description: item.product?.name || 'Produit',
      quantity: item.quantity,
      weight: parseInt(item.variant?.format.replace(/[^0-9]/g, '') || '100', 10),
      value: item.unit_price,
      sku: item.variant?.sku || '',
      product_id: item.id_product,
    }));

    console.log('📦 Données colis SendCloud:', JSON.stringify(parcelData, null, 2));

    // 5. Appeler SendCloud via l'API interne
    const sendcloudUrl = `${process.env.API_URL || 'http://localhost:3000'}/api/sendcloud/parcels`;

    const sendcloudResp = await fetch(sendcloudUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
      },
      body: JSON.stringify(parcelData),
    });

    if (!sendcloudResp.ok) {
      const error = await sendcloudResp.json();
      console.error('❌ Erreur SendCloud:', error);
      res.status(sendcloudResp.status).json({ success: false, ...error });
      return;
    }

    const parcel = await sendcloudResp.json();

    // 6. Mettre à jour la commande avec les infos SendCloud
    await this.orderService.updateSendCloudInfo(orderId, {
      sendcloud_parcel_id: parcel.id,
      tracking_number: parcel.tracking_number,
      tracking_url: parcel.tracking_url,
      label_url: parcel.label?.label_printer,
    });

    console.log(`✅ Étiquette créée pour commande ${orderId}`);

    res.json({
      success: true,
      data: {
        parcel_id: parcel.id,
        tracking_number: parcel.tracking_number,
        tracking_url: parcel.tracking_url,
        label_url: parcel.label?.label_printer,
        order_id: order.id_order
      },
    });

  } catch (error: any) {
    console.error('❌ Erreur création étiquette:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la création de l\'étiquette',
      details: error.message 
    });
  }
};

}
