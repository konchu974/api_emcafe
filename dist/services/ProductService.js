"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const database_1 = require("../config/database");
const Product_1 = require("../entities/Product");
const typeorm_1 = require("typeorm");
class ProductService {
    constructor() {
        this.productRepository = database_1.AppDataSource.getRepository(Product_1.Product);
    }
    async createProduct(createProductDto) {
        // Vérification de l'unicité du nom pour éviter les doublons
        const existingProduct = await this.productRepository.findOne({
            where: { name: createProductDto.name }
        });
        if (existingProduct) {
            throw new Error('Un produit avec ce nom existe déjà');
        }
        const product = this.productRepository.create({
            ...createProductDto,
            is_active: createProductDto.is_active !== false ? 1 : 0,
            created_at: new Date(),
            updated_at: new Date()
        });
        return await this.productRepository.save(product);
    }
    async getAllProducts(search, minPrice, maxPrice, minIntensity, maxIntensity, coffeeTypes, roastLevels, sizes, // 🆕 Nouveau filtre
    limit = 10, offset = 0) {
        const queryBuilder = this.productRepository.createQueryBuilder('product')
            .where('product.is_active = :isActive', { isActive: 1 });
        if (search) {
            queryBuilder.andWhere('(product.name LIKE :search OR product.description LIKE :search OR product.origin LIKE :search OR product.ingredient LIKE :search OR product.preparation LIKE :search)', { search: `%${search}%` });
        }
        if (minPrice !== undefined || maxPrice !== undefined) {
            queryBuilder.andWhere('product.price BETWEEN :minPrice AND :maxPrice', {
                minPrice: minPrice ?? 0,
                maxPrice: maxPrice ?? 999999
            });
        }
        if (minIntensity !== undefined || maxIntensity !== undefined) {
            queryBuilder.andWhere('product.intensity BETWEEN :minIntensity AND :maxIntensity', {
                minIntensity: minIntensity ?? 1,
                maxIntensity: maxIntensity ?? 10
            });
        }
        if (coffeeTypes && coffeeTypes.length > 0) {
            queryBuilder.andWhere('product.coffee_type IN (:...coffeeTypes)', { coffeeTypes });
        }
        if (roastLevels && roastLevels.length > 0) {
            queryBuilder.andWhere('product.roast_level IN (:...roastLevels)', { roastLevels });
        }
        // 🆕 Filtre par taille
        if (sizes && sizes.length > 0) {
            queryBuilder.andWhere('product.size IN (:...sizes)', { sizes });
        }
        return await queryBuilder
            .orderBy('product.created_at', 'DESC')
            .take(limit)
            .skip(offset)
            .getManyAndCount();
    }
    async getProductById(id) {
        const product = await this.productRepository.findOne({
            where: { id_product: id },
            relations: ['orderItems', 'orderItems.order'],
        });
        if (!product) {
            throw new Error(`Produit ${id} introuvable`);
        }
        return product;
    }
    async updateProduct(id, updateProductDto) {
        // Vérification de l'unicité du nom si celui-ci est modifié
        if (updateProductDto.name) {
            const existingProduct = await this.productRepository.findOne({
                where: { name: updateProductDto.name, id_product: (0, typeorm_1.Not)(id) }
            });
            if (existingProduct) {
                throw new Error('Un autre produit avec ce nom existe déjà');
            }
        }
        const payload = {
            ...updateProductDto,
            updated_at: new Date()
        };
        if (updateProductDto.is_active !== undefined) {
            payload.is_active = updateProductDto.is_active ? 1 : 0;
        }
        const result = await this.productRepository.update(id, payload);
        if (result.affected === 0) {
            throw new Error('Produit non trouvé');
        }
        return this.getProductById(id);
    }
    async deleteProduct(id) {
        // Désactivation plutôt que suppression physique
        const result = await this.productRepository.update(id, {
            is_active: 0,
            updated_at: new Date()
        });
        if (result.affected === 0) {
            throw new Error('Produit non trouvé');
        }
        return { message: 'Produit désactivé avec succès' };
    }
    async updateStock(id, quantity) {
        const product = await this.productRepository.findOne({
            where: { id_product: id },
        });
        if (!product) {
            throw new Error('Produit non trouvé');
        }
        if (product.stock + quantity < 0) {
            const error = new Error('Stock insuffisant');
            error.currentStock = product.stock;
            throw error;
        }
        product.stock += quantity;
        product.updated_at = new Date();
        return await this.productRepository.save(product);
    }
    async getLowStockProducts(threshold = 5) {
        return await this.productRepository.find({
            where: {
                stock: (0, typeorm_1.LessThan)(threshold),
                is_active: 1
            },
            order: {
                stock: 'ASC'
            }
        });
    }
    async getProductsByIntensityRange(min, max) {
        return await this.productRepository.find({
            where: {
                intensity: (0, typeorm_1.Between)(min, max),
                is_active: 1
            },
            order: {
                intensity: 'ASC'
            }
        });
    }
    async getFeaturedProducts(limit = 4) {
        return await this.productRepository.find({
            where: { is_active: 1 },
            order: {
                created_at: 'DESC'
            },
            take: limit
        });
    }
    async getProductsBySize(size) {
        return await this.productRepository.find({
            where: {
                size,
                is_active: 1
            },
            order: {
                name: 'ASC'
            }
        });
    }
    async getProductWithVariants(productId) {
        return this.productRepository.findOne({
            where: { id_product: productId, is_active: 1 },
            relations: ['variants'],
        });
    }
    async getAllProductsWithVariants() {
        return this.productRepository.find({
            where: { is_active: 1 },
            relations: ['variants'],
            order: { created_at: 'DESC' },
        });
    }
}
exports.ProductService = ProductService;
//# sourceMappingURL=ProductService.js.map