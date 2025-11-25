"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariantService = void 0;
const database_1 = require("../config/database");
const ProductVariant_1 = require("../entities/ProductVariant");
class VariantService {
    constructor() {
        this.variantRepository = database_1.AppDataSource.getRepository(ProductVariant_1.ProductVariant);
    }
    /**
     * Récupérer tous les variants d'un produit
     */
    async getVariantsByProductId(productId) {
        return this.variantRepository.find({
            where: {
                productId,
                isActive: true
            },
            order: { price: 'ASC' },
        });
    }
    /**
     * Récupérer un variant par ID
     */
    async getVariantById(variantId) {
        return this.variantRepository.findOne({
            where: { idVariant: variantId },
        });
    }
    /**
     * Créer un nouveau variant
     */
    async createVariant(data) {
        const variant = this.variantRepository.create({
            productId: data.productId,
            format: data.format,
            price: data.price,
            stock: data.stock,
            sku: data.sku || null,
            isActive: data.isActive ?? true,
        });
        return this.variantRepository.save(variant);
    }
    /**
     * Mettre à jour un variant
     */
    async updateVariant(variantId, data) {
        const variant = await this.getVariantById(variantId);
        if (!variant)
            return null;
        Object.assign(variant, data);
        return this.variantRepository.save(variant);
    }
    /**
     * Supprimer un variant (soft delete)
     */
    async deleteVariant(variantId) {
        const result = await this.variantRepository.update(variantId, {
            isActive: false,
        });
        return result.affected === 1;
    }
    /**
     * Supprimer définitivement un variant
     */
    async hardDeleteVariant(variantId) {
        const result = await this.variantRepository.delete(variantId);
        return result.affected === 1;
    }
    /**
     * Mettre à jour le stock d'un variant
     */
    async updateStock(variantId, quantity) {
        const variant = await this.getVariantById(variantId);
        if (!variant)
            return null;
        variant.stock = Math.max(0, variant.stock + quantity);
        return this.variantRepository.save(variant);
    }
}
exports.VariantService = VariantService;
//# sourceMappingURL=variant.js.map