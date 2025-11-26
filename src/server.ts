import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppDataSource } from './config/database';
import router from './routes';
import { stripeWebhook } from './controllers/stripeWebhookController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/* -------------------------------------------------------------
   1. STRIPE WEBHOOK (raw body required)
   !!! MUST be BEFORE express.json() !!!
------------------------------------------------------------- */
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

/* -------------------------------------------------------------
   2. NORMAL MIDDLEWARES (AFTER webhook)
------------------------------------------------------------- */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------------------------------------------------
   3. ROOT ROUTE
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
      payments: '/api/payments'
    }
  });
});

/* -------------------------------------------------------------
   4. HEALTH CHECK
------------------------------------------------------------- */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: AppDataSource.isInitialized ? 'connected' : 'disconnected'
  });
});

/* -------------------------------------------------------------
   5. MAIN API ROUTING
------------------------------------------------------------- */
app.use('/api', router);

/* -------------------------------------------------------------
   6. 404 HANDLER
------------------------------------------------------------- */
app.use((req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.path,
    method: req.method
  });
});

/* -------------------------------------------------------------
   7. GLOBAL ERROR HANDLER
------------------------------------------------------------- */
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
   8. DATABASE + SERVER STARTUP
------------------------------------------------------------- */
AppDataSource.initialize()
  .then(() => {
    console.log('✅ Connexion à la base de données MySQL réussie');

    app.listen(PORT, () => {
      console.log('\n============================================');
      console.log(`   Serveur démarré sur http://localhost:${PORT}`);
      console.log(`   Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log('============================================\n');

      console.log('Endpoints disponibles:\n');
      console.log('Authentification:');
      console.log('   POST   /api/auth/register');
      console.log('   POST   /api/auth/login');
      console.log('   GET    /api/auth/profile\n');

      console.log('Utilisateurs:');
      console.log('   GET    /api/users (admin)');
      console.log('   GET    /api/users/:id');
      console.log('   DELETE /api/users/:id (admin)\n');

      console.log(`Health check: http://localhost:${PORT}/health\n`);
    });
  })
  .catch((error) => {
    console.error('❌ Erreur de connexion à la base de données:', error);
    process.exit(1);
  });

export default app;
