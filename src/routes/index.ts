import express, { Router } from "express";
import { UserController } from "../controllers/UserController";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware";
import { validationMiddleware } from "../middlewares/validationMiddleware";
import { RegisterDto } from "../dtos/user/RegisterDto";
import { LoginDto } from "../dtos/user/LoginDto";
import { ProductController } from "../controllers/ProductController";
import { CreateProductDto } from "../dtos/product/CreateProductDto";
import { UpdateProductDto } from "../dtos/product/UpdateProductDto";
import { UpdateStockDto } from "../dtos/product/UpdateStockDto";
import { CreateOrderDto } from "../dtos/order/CreateOrderDto";
import { OrderController } from "../controllers/OrderController";
import { UpdateOrderStatusDto } from "../dtos/order/UpdateOrderStatusDto";
import { stripeWebhook } from "../controllers/stripeWebhookController";



// PAYMENT CONTROLLER — import only ONCE
import {
  createCardPayment,
  createBankTransfer,
  confirmStripePayment,
} from "../controllers/paymentController";

const router = Router();

// Controllers
const userController = new UserController();
const productController = new ProductController();
const orderController = new OrderController();

/* ==================== AUTH ROUTES ==================== */

router.post(
  "/auth/register",
  validationMiddleware(RegisterDto),
  userController.register
);

router.post(
  "/auth/login",
  validationMiddleware(LoginDto),
  userController.login
);

/* ==================== USER ROUTES ==================== */

router.get("/users", authMiddleware, userController.getAll);
router.get("/users/profile", authMiddleware, userController.getProfile);
router.get("/users/:id", authMiddleware, userController.getById);

router.put(
  "/users/:id",
  authMiddleware,
  validationMiddleware(RegisterDto),
  userController.updateUser
);

router.delete(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  userController.delete
);

/* ==================== PRODUCT ROUTES ==================== */

router.get("/products", productController.getAllProducts);
router.get("/products/featured", productController.getFeaturedProducts);

router.get(
  "/products/low-stock",
  authMiddleware,
  adminMiddleware,
  productController.getLowStockProducts
);

router.get("/products/by-intensity", productController.getProductsByIntensity);

router.get("/products/:id", productController.getProductById);

router.post(
  "/products",
  authMiddleware,
  adminMiddleware,
  validationMiddleware(CreateProductDto),
  productController.createProduct
);

router.put(
  "/products/:id",
  authMiddleware,
  adminMiddleware,
  validationMiddleware(UpdateProductDto),
  productController.updateProduct
);

router.delete(
  "/products/:id",
  authMiddleware,
  adminMiddleware,
  productController.deleteProduct
);

router.patch(
  "/products/:id/stock",
  authMiddleware,
  adminMiddleware,
  validationMiddleware(UpdateStockDto),
  productController.updateStock
);

/* ==================== ORDER ROUTES ==================== */

router.post(
  "/orders",
  authMiddleware,
  validationMiddleware(CreateOrderDto),
  orderController.createOrder
);

router.get("/orders", authMiddleware, adminMiddleware, orderController.getAllOrders);
router.get("/orders/my-orders", authMiddleware, orderController.getMyOrders);
router.get("/orders/:id", authMiddleware, orderController.getOrderById);

router.patch(
  "/orders/:id/status",
  authMiddleware,
  adminMiddleware,
  validationMiddleware(UpdateOrderStatusDto),
  orderController.updateOrderStatus
);

router.delete("/orders/:id", authMiddleware, adminMiddleware, orderController.deleteOrder);

/* ==================== PAYMENT ROUTES ==================== */

router.post("/payments/card", createCardPayment);
router.post("/payments/bank-transfer", createBankTransfer);
router.post("/payments/confirm-stripe", confirmStripePayment);

/* ==================== WEBHOOK ROUTER ==================== */
router.post("/payments/webhook", express.raw({ type: "application/json" }), stripeWebhook);



/* ==================== EXPORT ROUTER ==================== */
export default router;
