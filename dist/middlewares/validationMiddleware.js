"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationMiddleware = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const CreateOrderDto_1 = require("../dtos/order/CreateOrderDto");
const validationMiddleware = (dtoClass) => {
    return async (req, res, next) => {
        console.log('\n🔍 === VALIDATION MIDDLEWARE ===');
        try {
            // ✅ Transformation du DTO principal et cast en any
            const dtoInstance = (0, class_transformer_1.plainToInstance)(dtoClass, req.body, {
                enableImplicitConversion: true,
            });
            // ✅ Transformer chaque objet imbriqué dans items
            if (Array.isArray(dtoInstance.items)) {
                dtoInstance.items = dtoInstance.items.map((item) => (0, class_transformer_1.plainToInstance)(CreateOrderDto_1.CreateOrderItemDto, item, { enableImplicitConversion: true }));
            }
            console.log('🔄 DTO transformé:', dtoInstance);
            console.log('Instance type check items[0]:', dtoInstance.items?.[0] instanceof CreateOrderDto_1.CreateOrderItemDto);
            // Validation
            const errors = await (0, class_validator_1.validate)(dtoInstance, {
                whitelist: true,
                forbidNonWhitelisted: false,
            });
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Erreur de validation',
                    errors,
                });
            }
            req.body = dtoInstance;
            next();
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Erreur interne lors de la validation',
                error: error instanceof Error ? error.message : String(error),
            });
        }
    };
};
exports.validationMiddleware = validationMiddleware;
