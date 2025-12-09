// src/services/OrderService.ts

import { AppDataSource } from '../config/database';
import { Order } from '../entities/Order';
import { OrderItem } from '../entities/OrderItem';
import { Product } from '../entities/Product';
import { CreateOrderDto } from '../dtos/order/CreateOrderDto';
import { UpdateOrderStatusDto } from '../dtos/order/UpdateOrderStatusDto';

export class OrderService {
  private orderRepository = AppDataSource.getRepository(Order);
  private orderItemRepository = AppDataSource.getRepository(OrderItem);
  private productRepository = AppDataSource.getRepository(Product);

  // src/services/OrderService.ts (méthode createOrder)

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
      // ❌ notes supprimé
    });

    const savedOrder = await queryRunner.manager.save(order);
    console.log('✅ Commande créée:', savedOrder.id_order);

    let totalAmount = 0;

    for (const item of createOrderDto.items) {
      const product = await queryRunner.manager.findOne(Product, {
        where: { id_product: item.id_product },
      });

      if (!product) {
        throw new Error(`Produit ${item.id_product} non trouvé`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Stock insuffisant pour ${product.name}`);
      }

      const subtotal = Number(product.price) * item.quantity;

      const orderItem = queryRunner.manager.create(OrderItem, {
        id_order: savedOrder.id_order,
        id_product: product.id_product,
        quantity: item.quantity,
        unit_price: Number(product.price),
        subtotal: subtotal,
      });

      await queryRunner.manager.save(orderItem);

      product.stock -= item.quantity;
      await queryRunner.manager.save(product);

      totalAmount += subtotal;
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
      relations: ['user', 'orderItems', 'orderItems.product'],
      order: { created_at: 'DESC' },
    });
  }

  async getOrderById(id: string) {
    const order = await this.orderRepository.findOne({
      where: { id_order: id },
      relations: ['user', 'orderItems', 'orderItems.product'],
    });

    if (!order) {
      throw new Error('Commande non trouvée');
    }

    return order;
  }

  async getOrdersByUserId(userId: string) {
    return await this.orderRepository.find({
      where: { id_user_account: userId },
      relations: ['orderItems', 'orderItems.product'],
      order: { created_at: 'DESC' },
    });
  }

  async updateOrderStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto) {
    const order = await this.orderRepository.findOne({
      where: { id_order: id },
    });

    if (!order) {
      throw new Error('Commande non trouvée');
    }

    order.status = updateOrderStatusDto.status;
    return await this.orderRepository.save(order);
  }

  async deleteOrder(id: string) {
    const result = await this.orderRepository.delete(id);

    if (result.affected === 0) {
      throw new Error('Commande non trouvée');
    }

    return { message: 'Commande supprimée avec succès' };
  }
}
