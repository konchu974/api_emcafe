"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationMiddleware = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const validationMiddleware = (type) => {
    return async (req, res, next) => {
        const dto = (0, class_transformer_1.plainToClass)(type, req.body);
        const errors = await (0, class_validator_1.validate)(dto);
        if (errors.length > 0) {
            const messages = errors.map((error) => ({
                property: error.property,
                constraints: error.constraints,
            }));
            return res.status(400).json({ errors: messages });
        }
        req.body = dto;
        next();
    };
};
exports.validationMiddleware = validationMiddleware;
