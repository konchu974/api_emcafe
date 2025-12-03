"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundMiddleware = exports.errorMiddleware = void 0;
// Middleware pour les erreurs
const errorMiddleware = (error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({
        message: 'Erreur serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
};
exports.errorMiddleware = errorMiddleware;
// Middleware pour les routes non trouvées (404)
const notFoundMiddleware = (req, res, next) => {
    res.status(404).json({
        error: 'Route non trouvée',
        path: req.path,
        method: req.method,
    });
};
exports.notFoundMiddleware = notFoundMiddleware;
