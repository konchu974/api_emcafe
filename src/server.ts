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
  origin: ['http://localhost:4321', 'https://emcaffe.shop'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

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
   4. ROUTES
------------------------------------------------------------- */
app.get("/", (req, res) => {
  res.json({
    message: "API E-commerce EMCA",
    status: "running",
  });
});

app.get("/health", (req, res) => {
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
  res.status(404).json({
    error: "Route not found",
  });
});

/* -------------------------------------------------------------
   6. GLOBAL ERROR HANDLER
------------------------------------------------------------- */
app.use((err: any, req, res, next) => {
  console.error("❌ Global error:", err);
  res.status(err.statusCode || 500).json({
    error: err.message || "Internal server error",
  });
});

/* -------------------------------------------------------------
   7. DB + SERVER
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
