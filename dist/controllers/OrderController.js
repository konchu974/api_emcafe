"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const OrderService_1 = require("../services/OrderService");
class OrderController {
    constructor() {
        this.orderService = new OrderService_1.OrderService();
        this.createOrder = async (req, res) => {
            try {
                const order = await this.orderService.createOrder(req.body);
                res.status(201).json({
                    success: true,
                    data: order,
                });
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }
        };
        this.getAllOrders = async (req, res) => {
            try {
                const orders = await this.orderService.getAllOrders();
                res.json({
                    success: true,
                    data: orders,
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        };
        this.getOrderById = async (req, res) => {
            try {
                const order = await this.orderService.getOrderById(req.params.id);
                res.json({
                    success: true,
                    data: order,
                });
            }
            catch (error) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }
        };
        this.getMyOrders = async (req, res) => {
            try {
                const orders = await this.orderService.getOrdersByUserId(req.user.id);
                res.json({
                    success: true,
                    data: orders,
                });
            }
            catch (error) {
                res.status(500).json({
                    success: false,
                    message: error.message,
                });
            }
        };
        this.updateOrderStatus = async (req, res) => {
            try {
                const order = await this.orderService.updateOrderStatus(req.params.id, req.body);
                res.json({
                    success: true,
                    data: order,
                });
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }
        };
        this.deleteOrder = async (req, res) => {
            try {
                const result = await this.orderService.deleteOrder(req.params.id);
                res.json({
                    success: true,
                    data: result,
                });
            }
            catch (error) {
                res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }
        };
    }
}
exports.OrderController = OrderController;
//# sourceMappingURL=OrderController.js.map