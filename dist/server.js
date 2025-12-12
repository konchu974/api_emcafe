"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = __importDefault(require("body-parser"));
const database_1 = require("./config/database");
const routes_1 = __importDefault(require("./routes"));
const stripeWebhookController_1 = require("./controllers/stripeWebhookController");
const sendcloudRoutes_1 = __importDefault(require("./routes/sendcloudRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
/* -------------------------------------------------------------
   1. CORS
------------------------------------------------------------- */
app.use((0, cors_1.default)({
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
app.post("/api/webhooks/stripe", body_parser_1.default.raw({ type: "*/*" }), stripeWebhookController_1.stripeWebhook);
/* -------------------------------------------------------------
   3. NORMAL PARSERS (AFTER WEBHOOK)
------------------------------------------------------------- */
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
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
        database: database_1.AppDataSource.isInitialized ? "connected" : "disconnected",
    });
});
app.use("/api/sendcloud", sendcloudRoutes_1.default);
app.use("/api", routes_1.default);
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
app.use((err, req, res, next) => {
    console.error("❌ Global error:", err);
    res.status(err.statusCode || 500).json({
        error: err.message || "Internal server error",
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});
/* -------------------------------------------------------------
   7. DB + SERVER
------------------------------------------------------------- */
database_1.AppDataSource.initialize()
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
exports.default = app;
