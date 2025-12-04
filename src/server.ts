import "reflect-metadata";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AppDataSource } from "./config/database";
import router from "./routes";
import { stripeWebhook } from "./controllers/stripeWebhookController";
import sendcloudRoutes from "./routes/sendcloudRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/* -------------------------------------------------------------
   1. CORS CONFIGURATION
------------------------------------------------------------- */
app.use(cors({
  origin: ['http://localhost:4321', 'https://emcaffe.shop'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

/* -------------------------------------------------------------
   2. STRIPE WEBHOOK
   ⚠ IMPORTANT: Must stay BEFORE express.json()
------------------------------------------------------------- */
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

/* -------------------------------------------------------------
   3. GENERAL MIDDLEWARES
------------------------------------------------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------------------------------------------------
   4. ROOT ROUTE
------------------------------------------------------------- */
app.get("/", (req, res) => {
  res.json({
    message: "API E-commerce EMCA",
    version: "1.0.0",
    status: "running",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      products: "/api/products",
      orders: "/api/orders",
      payments: "/api/payments",
      sendcloud: "/api/sendcloud"
    }
  });
});

/* -------------------------------------------------------------
   5. HEALTH CHECK
------------------------------------------------------------- */
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database: AppDataSource.isInitialized ? "connected" : "disconnected",
  });
});

/* -------------------------------------------------------------
   6. API ROUTES
------------------------------------------------------------- */
app.use("/api/sendcloud", sendcloudRoutes);
app.use("/api", router);

/* -------------------------------------------------------------
   7. 404
------------------------------------------------------------- */
app.use((req, res) => {
  res.status(404).json({
    error: "Route non trouvée",
    path: req.path,
    method: req.method,
  });
});

/* -------------------------------------------------------------
   8. GLOBAL ERROR HANDLER
------------------------------------------------------------- */
app.use((err: any, req, res, next) => {
  console.error("❌ Global error:", err);

  res.status(err.statusCode || 500).json({
    error: err.message || "Erreur serveur interne",
  });
});

/* -------------------------------------------------------------
   9. DATABASE + SERVER STARTUP
------------------------------------------------------------- */
AppDataSource.initialize()
  .then(() => {
    console.log("✅ Database connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ DB Connection Error:", error);
    process.exit(1);
  });

export default app;
