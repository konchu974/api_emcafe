import "reflect-metadata";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { AppDataSource } from "./config/database";
import router from "./routes";
import { stripeWebhook } from "./controllers/stripeWebhookController";
import sendcloudRoutes from "./routes/sendcloudRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/* -------------------------------------------------------------
   1. CORS
------------------------------------------------------------- */
app.use(cors({
  origin: ['http://localhost:4321', 'https://emcaffe.shop', 'https://emcaffe-front.onrender.com'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));

/* -------------------------------------------------------------
   1.5. LOGGING MIDDLEWARE (AVANT TOUT)
------------------------------------------------------------- */
app.use((req, res, next) => {
  console.log('\n========================================');
  console.log(`📨 ${new Date().toISOString()}`);
  console.log(`📨 ${req.method} ${req.originalUrl}`);
  console.log(`📨 Content-Type:`, req.headers['content-type']);
  console.log(`📨 Origin:`, req.headers.origin);
  next();
});

/* -------------------------------------------------------------
   2. STRIPE WEBHOOK — MUST BE FIRST
------------------------------------------------------------- */
app.post(
  "/api/webhooks/stripe",
  bodyParser.raw({ type: "*/*" }),  
  stripeWebhook
);

/* -------------------------------------------------------------
   3. NORMAL PARSERS (AFTER WEBHOOK)
------------------------------------------------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------------------------------------------------
   3.5. LOGGING BODY (APRÈS PARSERS)
------------------------------------------------------------- */
app.use((req, res, next) => {
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📦 Body:`, JSON.stringify(req.body, null, 2));
  }
  console.log('========================================\n');
  next();
});

/* -------------------------------------------------------------
   4. ROUTES
------------------------------------------------------------- */
app.get("/", (req, res) => {
  res.json({
    message: "API E-commerce EMCA",
    status: "running",
  });
});

app.get("/health", (req, res) => {
  console.log('✅ Health check appelé');
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database: AppDataSource.isInitialized ? "connected" : "disconnected",
  });
});

app.use("/api/sendcloud", sendcloudRoutes);
app.use("/api", router);

/* -------------------------------------------------------------
   5. 404
------------------------------------------------------------- */
app.use((req, res) => {
  console.log(`❌ 404 - Route introuvable: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: "Route not found",
    method: req.method,
    url: req.originalUrl
  });
});

/* -------------------------------------------------------------
   6. GLOBAL ERROR HANDLER
------------------------------------------------------------- */
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("❌ Global error:", err);
  res.status(err.statusCode || 500).json({
    error: err.message || "Internal server error",
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

/* -------------------------------------------------------------
   7. DB + SERVER
------------------------------------------------------------- */
AppDataSource.initialize()
  .then(() => {
    console.log("✅ Database connected");

    app.listen(PORT, () => {
      console.log('\n🚀 ========================================');
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`🚀 ========================================`);
      console.log(`📍 Routes disponibles:`);
      console.log(`   - GET    http://localhost:${PORT}/health`);
      console.log(`   - POST   http://localhost:${PORT}/api/orders`);
      console.log(`   - GET    http://localhost:${PORT}/api/products`);
      console.log(`🚀 ========================================\n`);
    });
  })
  .catch((error) => {
    console.error("❌ DB Connection Error:", error);
    process.exit(1);
  });

export default app;
