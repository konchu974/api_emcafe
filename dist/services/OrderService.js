"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const database_1 = require("../config/database");
const Order_1 = require("../entities/Order");
const OrderItem_1 = require("../entities/OrderItem");
const Product_1 = require("../entities/Product");
class OrderService {
    constructor() {
        this.orderRepository = database_1.AppDataSource.getRepository(Order_1.Order);
        this.orderItemRepository = database_1.AppDataSource.getRepository(OrderItem_1.OrderItem);
        this.productRepository = database_1.AppDataSource.getRepository(Product_1.Product);
    }
    async createOrder(createOrderDto) {
        const queryRunner = database_1.AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            // Créer la commande
            const order = queryRunner.manager.create(Order_1.Order, {
                id_user_account: createOrderDto.id_user_account,
                status: 'PENDING',
                total: 0,
            });
            await queryRunner.manager.save(order);
            let total = 0;
            // Créer les items de commande
            for (const item of createOrderDto.items) {
                const product = await queryRunner.manager.findOne(Product_1.Product, {
                    where: { id_product: item.id_product },
                });
                if (!product) {
                    throw new Error(`Produit ${item.id_product} non trouvé`);
                }
                if (product.stock < item.quantity) {
                    throw new Error(`Stock insuffisant pour le produit ${product.name}`);
                }
                const subtotal = product.price * item.quantity;
                total += subtotal;
                // Créer l'order item
                const orderItem = queryRunner.manager.create(OrderItem_1.OrderItem, {
                    id_order: order.id_order,
                    quantity: item.quantity,
                    subtotal,
                });
                await queryRunner.manager.save(orderItem);
                // Mettre à jour le stock
                product.stock -= item.quantity;
                await queryRunner.manager.save(product);
            }
            // Mettre à jour le total de la commande
            order.total = total;
            await queryRunner.manager.save(order);
            await queryRunner.commitTransaction();
            return await this.getOrderById(order.id_order);
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async getAllOrders() {
        return await this.orderRepository.find({
            relations: ['user', 'orderItems', 'orderItems.orderItemProducts', 'orderItems.orderItemProducts.product'],
        });
    }
    async getOrderById(id) {
        const order = await this.orderRepository.findOne({
            where: { id_order: id },
            relations: ['user', 'orderItems', 'orderItems.orderItemProducts', 'orderItems.orderItemProducts.product'],
        });
        if (!order) {
            throw new Error('Commande non trouvée');
        }
        return order;
    }
    async getOrdersByUserId(userId) {
        return await this.orderRepository.find({
            where: { id_user_account: userId },
            relations: ['orderItems', 'orderItems.orderItemProducts', 'orderItems.orderItemProducts.product'],
            order: { created_at: 'DESC' },
        });
    }
    async updateOrderStatus(id, updateOrderStatusDto) {
        const order = await this.orderRepository.findOne({
            where: { id_order: id },
        });
        if (!order) {
            throw new Error('Commande non trouvée');
        }
        order.status = updateOrderStatusDto.status;
        return await this.orderRepository.save(order);
    }
    async deleteOrder(id) {
        const result = await this.orderRepository.delete(id);
        if (result.affected === 0) {
            throw new Error('Commande non trouvée');
        }
        return { message: 'Commande supprimée avec succès' };
    }
}
exports.OrderService = OrderService;
//# sourceMappingURL=OrderService.js.map