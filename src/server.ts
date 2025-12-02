import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AppDataSource } from './config/database';
import router from './routes';
import { stripeWebhook } from './controllers/stripeWebhookController';
import sendcloudRoutes from './routes/sendcloudRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/* -------------------------------------------------------------
   1. CORS CONFIGURATION
------------------------------------------------------------- */
app.use(cors({
  origin: 'http://localhost:4321', // Frontend Astro
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

/* -------------------------------------------------------------
   2. STRIPE WEBHOOK (AVANT express.json() !)
   ⚠️ IMPORTANT : Doit être avant express.json()
------------------------------------------------------------- */
app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

/* -------------------------------------------------------------
   3. MIDDLEWARES GÉNÉRAUX
------------------------------------------------------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    database: AppDataSource.isInitialized ? 'connected' : 'disconnected'
  });
});

/* -------------------------------------------------------------
   6. API ROUTES
------------------------------------------------------------- */
app.use('/api/sendcloud', sendcloudRoutes);
app.use('/api', router);

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
   9. DATABASE + SERVER STARTUP
------------------------------------------------------------- */
AppDataSource.initialize()
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

export default app;
