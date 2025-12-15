import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateOrderItemDto } from '../dtos/order/CreateOrderDto';

export const validationMiddleware = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    console.log('\n🔍 === VALIDATION MIDDLEWARE ===');
    console.log('🎯 DTO Class:', dtoClass.name);

    try {
      // ✅ Transformation du DTO principal
      const dtoInstance = plainToInstance(dtoClass, req.body, {
        enableImplicitConversion: true,
        excludeExtraneousValues: false,
      }) as any;

      console.log('🔄 DTO transformé:', dtoInstance.constructor.name);

      // ✅ Transformation des items SEULEMENT si le champ existe dans le DTO
      if ('items' in dtoInstance && Array.isArray(dtoInstance.items)) {
        console.log(`📦 Transformation de ${dtoInstance.items.length} item(s)...`);
        
        dtoInstance.items = dtoInstance.items.map((item: any, index: number) => {
          const transformedItem = plainToInstance(CreateOrderItemDto, item, {
            enableImplicitConversion: true,
          });
          
          console.log(`   ✓ Item ${index}: ${transformedItem.constructor.name}`);
          return transformedItem;
        });

        // Vérification du type du premier item
        if (dtoInstance.items.length > 0) {
          const isValidType = dtoInstance.items[0] instanceof CreateOrderItemDto;
          console.log(`📋 Type check items[0]: ${isValidType ? '✅' : '❌'}`);
        }
      } else {
        console.log('ℹ️  Pas de champ "items" dans ce DTO');
      }

      // ✅ VALIDATION
      const errors = await validate(dtoInstance, {
        whitelist: true,
        forbidNonWhitelisted: false,
        skipMissingProperties: false,
        validationError: { target: false, value: true },
      });

      if (errors.length > 0) {
        console.log(`❌ ${errors.length} erreur(s) de validation détectée(s)`);
        
        const formattedErrors = formatValidationErrors(errors);
        console.log('📋 Détails:', JSON.stringify(formattedErrors, null, 2));

        return res.status(400).json({
          success: false,
          message: 'Erreur de validation',
          errors: formattedErrors,
        });
      }

      console.log('✅ Validation réussie');
      req.body = dtoInstance;
      next();

    } catch (error) {
      console.error('💥 Erreur middleware:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Erreur interne lors de la validation',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };
};

/**
 * 📋 Formatte les erreurs de validation de manière lisible
 */
function formatValidationErrors(errors: ValidationError[]): Record<string, any> {
  const formatted: Record<string, any> = {};

  errors.forEach((error) => {
    // Erreurs directes (ex: email, password)
    if (error.constraints) {
      formatted[error.property] = Object.values(error.constraints);
    }

    // Erreurs imbriquées (ex: items[0].quantity)
    if (error.children && error.children.length > 0) {
      formatted[error.property] = formatValidationErrors(error.children);
    }
  });

  return formatted;
}
