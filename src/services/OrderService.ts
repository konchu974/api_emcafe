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

  async createOrder(createOrderDto: CreateOrderDto) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log('🛒 Création commande pour user:', createOrderDto.id_user_account);

      const order = queryRunner.manager.create(Order, {
        id_user_account: createOrderDto.id_user_account,
        status: 'PENDING',
        total: 0,
        delivery_address: createOrderDto.delivery_address,
        delivery_city: createOrderDto.delivery_city,
        delivery_postal_code: createOrderDto.delivery_postal_code,
        delivery_phone: createOrderDto.delivery_phone,
        email: createOrderDto.email,
      });

      const savedOrder = await queryRunner.manager.save(order);
      console.log('✅ Commande créée:', savedOrder.id_order);

      let totalAmount = 0;

      for (const item of createOrderDto.items) {
        // ✅ Vérifier le produit
        const product = await queryRunner.manager.findOne(Product, {
          where: { id_product: item.id_product },
        });

        if (!product) {
          throw new Error(`Produit ${item.id_product} non trouvé`);
        }

        // ✅ Vérifier le variant (utiliser camelCase)
        const variant = await queryRunner.manager.findOne(ProductVariant, {
          where: { 
            idVariant: item.id_variant,  // ✅ camelCase
            productId: item.id_product,  // ✅ camelCase
            isActive: true               // ✅ camelCase
          },
        });

        if (!variant) {
          throw new Error(
            `Variant ${item.id_variant} non trouvé ou inactif pour le produit ${product.name}`
          );
        }

        // ✅ Vérifier le stock du variant
        if (variant.stock < item.quantity) {
          throw new Error(
            `Stock insuffisant pour ${product.name} (${variant.format}). ` +
            `Disponible: ${variant.stock}, Demandé: ${item.quantity}`
          );
        }

        // ✅ Calculer le sous-total avec le prix du variant
        const subtotal = Number(variant.price) * item.quantity;

        // ✅ Créer l'OrderItem avec id_variant
        const orderItem = queryRunner.manager.create(OrderItem, {
          id_order: savedOrder.id_order,
          id_product: product.id_product,
          id_variant: variant.idVariant,  // ✅ Utiliser idVariant (camelCase)
          quantity: item.quantity,
          unit_price: Number(variant.price),
          subtotal: subtotal,
        });

        await queryRunner.manager.save(orderItem);

        // ✅ Décrémenter le stock du variant
        variant.stock -= item.quantity;
        await queryRunner.manager.save(variant);

        totalAmount += subtotal;

        console.log(`✅ Item ajouté: ${product.name} (${variant.format}) x${item.quantity}`);
      }

      savedOrder.total = totalAmount;
      await queryRunner.manager.save(savedOrder);

      console.log('✅ Total commande:', totalAmount);

      await queryRunner.commitTransaction();

      return await this.getOrderById(savedOrder.id_order);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('❌ Erreur:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getAllOrders() {
    return await this.orderRepository.find({
      relations: ['user', 'orderItems', 'orderItems.product', 'orderItems.variant'],
      order: { created_at: 'DESC' },
    });
  }

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

  async getOrdersByUserId(userId: string) {
    return await this.orderRepository.find({
      where: { id_user_account: userId },
      relations: ['orderItems', 'orderItems.product', 'orderItems.variant'],
      order: { created_at: 'DESC' },
    });
  }

  async updateOrderStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto) {
    const order = await this.orderRepository.findOne({
      where: { id_order: id },
      relations: ['orderItems', 'orderItems.variant']
    });

    if (!order) {
      throw new Error('Commande non trouvée');
    }

    // ✅ Si la commande est annulée, remettre les stocks
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
