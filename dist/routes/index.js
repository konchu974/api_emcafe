"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserController_1 = require("../controllers/UserController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const RegisterDto_1 = require("../dtos/user/RegisterDto");
const LoginDto_1 = require("../dtos/user/LoginDto");
const ProductController_1 = require("../controllers/ProductController");
const CreateProductDto_1 = require("../dtos/product/CreateProductDto");
const UpdateProductDto_1 = require("../dtos/product/UpdateProductDto");
const UpdateStockDto_1 = require("../dtos/product/UpdateStockDto");
const CreateOrderDto_1 = require("../dtos/order/CreateOrderDto");
const OrderController_1 = require("../controllers/OrderController");
const UpdateOrderStatusDto_1 = require("../dtos/order/UpdateOrderStatusDto");
const paymentController_1 = require("../controllers/paymentController");
const VariantController_1 = require("../controllers/VariantController");
const router = (0, express_1.Router)();
const userController = new UserController_1.UserController();
const productController = new ProductController_1.ProductController();
const orderController = new OrderController_1.OrderController();
const variantController = new VariantController_1.VariantController();
/* ==================== AUTH ROUTES ==================== */
router.post("/auth/register", (0, validationMiddleware_1.validationMiddleware)(RegisterDto_1.RegisterDto), userController.register);
router.post("/auth/login", (0, validationMiddleware_1.validationMiddleware)(LoginDto_1.LoginDto), userController.login);
/* ==================== USER ROUTES ==================== */
// MUST BE FIRST
router.put("/users/address", authMiddleware_1.authMiddleware, userController.updateAddress);
router.get("/users", authMiddleware_1.authMiddleware, userController.getAll);
router.get("/users/profile", authMiddleware_1.authMiddleware, userController.getProfile);
router.get("/users/:id", authMiddleware_1.authMiddleware, userController.getById);
// IMPORTANT: NO VALIDATION MIDDLEWARE HERE
router.put("/users/:id", authMiddleware_1.authMiddleware, userController.updateUser);
router.delete("/users/:id", authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, userController.delete);
/* ==================== PRODUCT ROUTES ==================== */
router.get('/products/full', productController.getAllProductsWithVariants);
router.get('/products/:id/full', productController.getProductWithVariants);
router.get("/products", productController.getAllProducts);
router.get("/products/featured", productController.getFeaturedProducts);
router.get('/size/:size', productController.getProductsBySize);
router.get("/products/low-stock", authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, productController.getLowStockProducts);
router.get("/products/by-intensity", productController.getProductsByIntensity);
router.get("/products/:id", productController.getProductById);
router.post("/products", authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, (0, validationMiddleware_1.validationMiddleware)(CreateProductDto_1.CreateProductDto), productController.createProduct);
router.put("/products/:id", authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, (0, validationMiddleware_1.validationMiddleware)(UpdateProductDto_1.UpdateProductDto), productController.updateProduct);
router.delete("/products/:id", authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, productController.deleteProduct);
router.patch("/products/:id/stock", authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, (0, validationMiddleware_1.validationMiddleware)(UpdateStockDto_1.UpdateStockDto), productController.updateStock);
/* ==================== ORDER ROUTES ==================== */
router.post("/orders", authMiddleware_1.authMiddleware, (0, validationMiddleware_1.validationMiddleware)(CreateOrderDto_1.CreateOrderDto), orderController.createOrder);
router.get("/orders", authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, orderController.getAllOrders);
router.get("/orders/my-orders", authMiddleware_1.authMiddleware, orderController.getMyOrders);
router.get("/orders/:id", authMiddleware_1.authMiddleware, orderController.getOrderById);
router.patch("/orders/:id/status", authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, (0, validationMiddleware_1.validationMiddleware)(UpdateOrderStatusDto_1.UpdateOrderStatusDto), orderController.updateOrderStatus);
router.delete("/orders/:id", authMiddleware_1.authMiddleware, authMiddleware_1.adminMiddleware, orderController.deleteOrder);
/* ==================== PAYMENT ROUTES ==================== */
router.post("/payments/card", paymentController_1.createCardPayment);
router.post("/payments/bank-transfer", paymentController_1.createBankTransfer);
router.post("/payments/confirm-stripe", paymentController_1.confirmStripePayment);
/* ==================== EXPORT ROUTER ==================== */
// Routes publiques
router.get('/products/:productId/variants', variantController.getVariantsByProduct);
router.get('/variants/:id', variantController.getVariantById);
// Routes protégées (admin uniquement)
router.post('/variants', authMiddleware_1.authMiddleware, variantController.createVariant);
router.patch('/variants/:id', authMiddleware_1.authMiddleware, variantController.updateVariant);
router.delete('/variants/:id', authMiddleware_1.authMiddleware, variantController.deleteVariant);
router.patch('/variants/:id/stock', authMiddleware_1.authMiddleware, variantController.updateStock);
exports.default = router;
