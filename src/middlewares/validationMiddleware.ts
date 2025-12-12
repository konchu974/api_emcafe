import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateOrderItemDto } from '../dtos/order/CreateOrderDto';

export const validationMiddleware = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    console.log('\n🔍 === VALIDATION MIDDLEWARE ===');

    try {
      // ✅ Transformation du DTO principal et cast en any
      const dtoInstance = plainToInstance(dtoClass, req.body, {
        enableImplicitConversion: true,
      }) as any;

      // ✅ Transformer chaque objet imbriqué dans items
      if (Array.isArray(dtoInstance.items)) {
        dtoInstance.items = dtoInstance.items.map((item: any) =>
          plainToInstance(CreateOrderItemDto, item, { enableImplicitConversion: true })
        );
      }

      console.log('🔄 DTO transformé:', dtoInstance);
      console.log('Instance type check items[0]:',
        dtoInstance.items?.[0] instanceof CreateOrderItemDto
      );

      // Validation
      const errors = await validate(dtoInstance, {
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

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erreur interne lors de la validation',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };
};
