"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = exports.authMiddleware = void 0;
const jwt_1 = require("../utils/jwt");
const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token manquant' });
        }
        const decoded = (0, jwt_1.verifyToken)(token);
        if (!decoded) {
            return res.status(401).json({ message: 'Token invalide' });
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Non autorisé' });
    }
};
exports.authMiddleware = authMiddleware;
const adminMiddleware = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Accès refusé' });
    }
    next();
};
exports.adminMiddleware = adminMiddleware;
