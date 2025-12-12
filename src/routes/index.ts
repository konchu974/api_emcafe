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
import { OrderController } from "../controllers/OrderController";
import { UpdateOrderStatusDto } from "../dtos/order/UpdateOrderStatusDto";

import {
  createCardPayment,
  createBankTransfer,
  confirmStripePayment,
} from "../controllers/paymentController";

import { VariantController } from "../controllers/VariantController";
import { CreateOrderDto } from "../dtos/order/CreateOrderDto";

const router = Router();

const userController = new UserController();
const productController = new ProductController();
const orderController = new OrderController();
const variantController = new VariantController();

/* ==================== AUTH ==================== */
router.post("/auth/register", validationMiddleware(RegisterDto), userController.register);
router.post("/auth/login", validationMiddleware(LoginDto), userController.login);

/* ==================== USERS ==================== */
router.put("/users/address", authMiddleware, userController.updateAddress);
router.get("/users", authMiddleware, userController.getAll);
router.get("/users/profile", authMiddleware, userController.getProfile);
router.get("/users/:id", authMiddleware, userController.getById);
router.put("/users/:id", authMiddleware, userController.updateUser);
router.delete("/users/:id", authMiddleware, adminMiddleware, userController.delete);

/* ==================== PRODUCTS ==================== */
router.get('/products/full', productController.getAllProductsWithVariants); 
router.get('/products/:id/full', productController.getProductWithVariants); 
router.get("/products", productController.getAllProducts);
router.get("/products/featured", productController.getFeaturedProducts);
router.get('/products/size/:size', productController.getProductsBySize); // ✅ Ajout de /products/
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

/* ==================== ORDERS ==================== */
// ✅ ORDRE IMPORTANT : routes spécifiques AVANT les routes avec paramètres

// 1. Routes publiques (sans auth)
router.post('/orders/track', orderController.trackOrder); // ✅ AVANT /orders/:id

// 2. Routes protégées sans paramètres
router.get("/orders/my-orders", authMiddleware, orderController.getMyOrders); // ✅ AVANT /orders/:id

// 3. Routes admin sans paramètres
router.get("/orders", authMiddleware, adminMiddleware, orderController.getAllOrders);

// 4. Routes avec paramètres
router.get("/orders/:id", authMiddleware, orderController.getOrderById);

router.post(
  "/orders/:id/create-label",
  authMiddleware,
  adminMiddleware,
  orderController.createLabel
);

router.patch(
  "/orders/:id/status",
  authMiddleware,
  adminMiddleware,
  validationMiddleware(UpdateOrderStatusDto),
  orderController.updateOrderStatus
);

router.delete(
  "/orders/:id",
  authMiddleware,
  adminMiddleware,
  orderController.deleteOrder
);

// 5. Création de commande (POST)
router.post(
  "/orders",
  validationMiddleware(CreateOrderDto), // ✅ ENLEVER authMiddleware si commande invité
  orderController.createOrder
);

/* ==================== PAYMENTS ==================== */
router.post("/payments/card", createCardPayment);
router.post("/payments/bank-transfer", createBankTransfer);
router.post("/payments/confirm-stripe", confirmStripePayment);

/* ==================== VARIANTS ==================== */
router.get("/products/:productId/variants", variantController.getVariantsByProduct);
router.get("/variants/:id", variantController.getVariantById);
router.post("/variants", authMiddleware, variantController.createVariant);
router.patch("/variants/:id", authMiddleware, variantController.updateVariant);
router.delete("/variants/:id", authMiddleware, variantController.deleteVariant);
router.patch("/variants/:id/stock", authMiddleware, variantController.updateStock);

export default router;
