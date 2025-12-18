// src/services/OrderService.ts

import { AppDataSource } from '../config/database';
import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { Product } from '../entities/Product';
import { ProductVariant } from '../entities/ProductVariant';
import { CreateOrderDto } from '../dtos/order/CreateOrderDto';
import { UpdateOrderStatusDto } from '../dtos/order/UpdateOrderStatusDto';

export class OrderService {
  private orderRepository = AppDataSource.getRepository(Order);
  private orderItemRepository = AppDataSource.getRepository(OrderItem);
  private productRepository = AppDataSource.getRepository(Product);
  private variantRepository = AppDataSource.getRepository(ProductVariant);

  /**
   * Créer une commande
   */
 async createOrder(createOrderDto: CreateOrderDto) {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    console.log('🛒 Création commande pour user:', createOrderDto.id_user_account);

    // ✅ Créer la commande principale
    const order = queryRunner.manager.create(Order, {
      id_user_account: createOrderDto.id_user_account,
      status: 'PENDING',
      total: 0,
      delivery_address: createOrderDto.delivery_address,
      delivery_city: createOrderDto.delivery_city,
      delivery_postal_code: createOrderDto.delivery_postal_code,
      delivery_country: createOrderDto.delivery_country || 'FR',
      delivery_phone: createOrderDto.delivery_phone,
      email: createOrderDto.email,
      is_relay_delivery: createOrderDto.is_relay_delivery || false,
      relay_point_id: createOrderDto.relay_point_id,
      relay_point_name: createOrderDto.relay_point_name,
      relay_carrier: createOrderDto.relay_carrier,
      notes: createOrderDto.notes,
      sendcloud_parcel_id: createOrderDto.sendcloud_parcel_id,
      sendcloud_order_number: createOrderDto.sendcloud_order_number,
      tracking_number: createOrderDto.tracking_number,
    });

    const savedOrder = await queryRunner.manager.save(order);
    console.log('✅ Commande créée:', savedOrder.id_order);

    let totalAmount = 0;

    for (const item of createOrderDto.items) {
      // ✅ Vérifier le produit
      const product = await queryRunner.manager.findOne(Product, {
        where: { id_product: item.id_product },
      });
      if (!product) throw new Error(`Produit ${item.id_product} non trouvé`);

      // ✅ Vérifier le variant
      const variant = await queryRunner.manager.findOne(ProductVariant, {
        where: { 
          idVariant: item.id_variant,
          productId: item.id_product,
          isActive: true
        },
      });
      if (!variant) throw new Error(`Variant ${item.id_variant} non trouvé ou inactif pour ${product.name}`);

      // ✅ Vérifier le stock
      if (variant.stock < item.quantity) {
        throw new Error(
          `Stock insuffisant pour ${product.name} (${variant.format}). ` +
          `Disponible: ${variant.stock}, Demandé: ${item.quantity}`
        );
      }

      // ✅ Calculer le sous-total
      const subtotal = Number(variant.price) * item.quantity;

      // ✅ Créer l'OrderItem
      const orderItem = queryRunner.manager.create(OrderItem, {
        id_order: savedOrder.id_order,
        id_product: product.id_product,
        id_variant: variant.idVariant,
        quantity: item.quantity,
        unit_price: Number(variant.price),
        subtotal: subtotal,
      });

      await queryRunner.manager.save(orderItem);

      // ✅ Décrémenter le stock
      variant.stock -= item.quantity;
      await queryRunner.manager.save(variant);

      totalAmount += subtotal;
      console.log(`✅ Item ajouté: ${product.name} (${variant.format}) x${item.quantity}`);
    }

    // ✅ Ajouter le coût de livraison au total
    const deliveryCost = createOrderDto.delivery_cost || 0;
    const finalTotal = totalAmount + deliveryCost;

    savedOrder.total = finalTotal;
    await queryRunner.manager.save(savedOrder);

    console.log('✅ Total commande (produits + livraison):', finalTotal);

    await queryRunner.commitTransaction();

    return await this.getOrderById(savedOrder.id_order);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Erreur création commande:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}

  /**
   * Récupérer toutes les commandes (admin)
   */
  async getAllOrders() {
    return await this.orderRepository.find({
      relations: ['user', 'orderItems', 'orderItems.product', 'orderItems.variant'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Récupérer une commande par ID
   */
  async getOrderById(id: string) {
    const order = await this.orderRepository.findOne({
      where: { id_order: id },
      relations: ['user', 'orderItems', 'orderItems.product', 'orderItems.variant'],
    });

    if (!order) {
      throw new Error('Commande non trouvée');
    }

    return order;
  }

  /**
   * Suivre une commande (public)
   */
  async trackOrder(orderId: string, postalCode: string): Promise<Order | null> {
    const order = await this.orderRepository.findOne({
      where: { 
        id_order: orderId,
        delivery_postal_code: postalCode
      },
      relations: ['orderItems', 'orderItems.product', 'orderItems.variant']
    });

    return order;
  }

  /**
   * Récupérer les commandes d'un utilisateur
   */
  async getOrdersByUserId(userId: string) {
    return await this.orderRepository.find({
      where: { id_user_account: userId },
      relations: ['orderItems', 'orderItems.product', 'orderItems.variant'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Mettre à jour le statut d'une commande
   */
  async updateOrderStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto) {
    const order = await this.orderRepository.findOne({
      where: { id_order: id },
      relations: ['orderItems', 'orderItems.variant']
    });

    if (!order) {
      throw new Error('Commande non trouvée');
    }

    // ✅ Si annulation, remettre les stocks
    if (updateOrderStatusDto.status === 'CANCELLED' && order.status !== 'CANCELLED') {
      for (const item of order.orderItems) {
        if (item.variant) {
          item.variant.stock += item.quantity;
          await this.variantRepository.save(item.variant);
          console.log(`✅ Stock remis: ${item.variant.format} +${item.quantity}`);
        }
      }
    }

    order.status = updateOrderStatusDto.status;
    return await this.orderRepository.save(order);
  }

  /**
   * ✅ NOUVEAU : Mettre à jour les infos SendCloud
   */
  async updateSendCloudInfo(
    orderId: string,
    data: {
      sendcloud_parcel_id?: number;
      tracking_number?: string;
      tracking_url?: string;
      label_url?: string;
    }
  ): Promise<Order> {
    const order = await this.getOrderById(orderId);

    if (data.sendcloud_parcel_id) {
      order.sendcloud_parcel_id = data.sendcloud_parcel_id;
    }
    if (data.tracking_number) {
      order.tracking_number = data.tracking_number;
    }
    if (data.tracking_url) {
      order.tracking_url = data.tracking_url;
    }
    if (data.label_url) {
      order.label_url = data.label_url;
    }

    console.log(`📦 SendCloud mis à jour pour commande ${orderId}`);
    return await this.orderRepository.save(order);
  }

  /**
   * Supprimer une commande
   */
  async deleteOrder(id: string) {
    const order = await this.orderRepository.findOne({
      where: { id_order: id },
      relations: ['orderItems', 'orderItems.variant']
    });

    if (!order) {
      throw new Error('Commande non trouvée');
    }

    // ✅ Remettre les stocks avant suppression
    for (const item of order.orderItems) {
      if (item.variant) {
        item.variant.stock += item.quantity;
        await this.variantRepository.save(item.variant);
        console.log(`✅ Stock restauré: ${item.variant.format} +${item.quantity}`);
      }
    }

    await this.orderRepository.remove(order);

    return { message: 'Commande supprimée avec succès' };
  }
}
