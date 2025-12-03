"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const routes_1 = __importDefault(require("./routes"));
const stripeWebhookController_1 = require("./controllers/stripeWebhookController");
const sendcloudRoutes_1 = __importDefault(require("./routes/sendcloudRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
/* -------------------------------------------------------------
   1. CORS CONFIGURATION
------------------------------------------------------------- */
app.use((0, cors_1.default)({
    origin: 'http://localhost:4321', // Frontend Astro
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
/* -------------------------------------------------------------
   2. STRIPE WEBHOOK (AVANT express.json() !)
   ⚠️ IMPORTANT : Doit être avant express.json()
------------------------------------------------------------- */
app.post('/api/webhooks/stripe', express_1.default.raw({ type: 'application/json' }), stripeWebhookController_1.stripeWebhook);
/* -------------------------------------------------------------
   3. MIDDLEWARES GÉNÉRAUX
------------------------------------------------------------- */
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
/* -------------------------------------------------------------
   4. ROOT ROUTE
------------------------------------------------------------- */
app.get('/', (req, res) => {
    res.json({
        message: 'API E-commerce EMCA',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            products: '/api/products',
            orders: '/api/orders',
            payments: '/api/payments',
            relay: '/api/relay',
            sendcloud: '/api/sendcloud'
        }
    });
});
/* -------------------------------------------------------------
   5. HEALTH CHECK
------------------------------------------------------------- */
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: database_1.AppDataSource.isInitialized ? 'connected' : 'disconnected'
    });
});
/* -------------------------------------------------------------
   6. API ROUTES
------------------------------------------------------------- */
app.use('/api/sendcloud', sendcloudRoutes_1.default);
app.use('/api', routes_1.default);
/* -------------------------------------------------------------
   7. 404 HANDLER
------------------------------------------------------------- */
app.use((req, res) => {
    res.status(404).json({
        error: 'Route non trouvée',
        path: req.path,
        method: req.method
    });
});
/* -------------------------------------------------------------
   8. GLOBAL ERROR HANDLER
------------------------------------------------------------- */
app.use((err, req, res, next) => {
    console.error('❌ Erreur:', err);
    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Erreur serveur interne';
    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack,
            details: err.details
        })
    });
});
/* -------------------------------------------------------------
   9. DATABASE + SERVER STARTUP
------------------------------------------------------------- */
database_1.AppDataSource.initialize()
    .then(() => {
    console.log('✅ Connexion à la base de données MySQL réussie');
    app.listen(PORT, () => {
        console.log('\n============================================');
        console.log(`   🚀 Serveur démarré sur http://localhost:${PORT}`);
        console.log(`   📦 Environnement: ${process.env.NODE_ENV || 'development'}`);
        console.log('============================================\n');
        console.log('📍 Endpoints disponibles:\n');
        console.log('Authentification:');
        console.log('   POST   /api/auth/register');
        console.log('   POST   /api/auth/login');
        console.log('   GET    /api/auth/profile\n');
        console.log('Utilisateurs:');
        console.log('   GET    /api/users (admin)');
        console.log('   GET    /api/users/:id');
        console.log('   DELETE /api/users/:id (admin)\n');
        console.log('SendCloud:');
        console.log('   GET    /api/sendcloud/service-points\n');
        console.log('Relay:');
        console.log('   ...    /api/relay/*\n');
        console.log(`🏥 Health check: http://localhost:${PORT}/health\n`);
    });
})
    .catch((error) => {
    console.error('❌ Erreur de connexion à la base de données:', error);
    process.exit(1);
});
exports.default = app;
