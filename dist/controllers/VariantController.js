"use strict";
// backend/src/controllers/variant.controller.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariantController = void 0;
const variant_1 = require("../services/variant");
const class_validator_1 = require("class-validator");
const CreateVariant_1 = require("../dtos/product/CreateVariant");
const UpdateVariant_1 = require("../dtos/product/UpdateVariant");
class VariantController {
    constructor() {
        this.variantService = new variant_1.VariantService();
        /**
         * GET /api/products/:productId/variants
         * Récupérer tous les variants d'un produit
         */
        this.getVariantsByProduct = async (req, res) => {
            try {
                const { productId } = req.params;
                const variants = await this.variantService.getVariantsByProductId(productId);
                return res.json({
                    success: true,
                    data: variants,
                });
            }
            catch (error) {
                console.error('Error fetching variants:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la récupération des variants',
                });
            }
        };
        /**
         * GET /api/variants/:id
         * Récupérer un variant par ID
         */
        this.getVariantById = async (req, res) => {
            try {
                const { id } = req.params;
                const variant = await this.variantService.getVariantById(id);
                if (!variant) {
                    return res.status(404).json({
                        success: false,
                        message: 'Variant non trouvé',
                    });
                }
                return res.json({
                    success: true,
                    data: variant,
                });
            }
            catch (error) {
                console.error('Error fetching variant:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la récupération du variant',
                });
            }
        };
        /**
         * POST /api/variants
         * Créer un nouveau variant
         */
        this.createVariant = async (req, res) => {
            try {
                const dto = Object.assign(new CreateVariant_1.CreateVariantDto(), req.body);
                const errors = await (0, class_validator_1.validate)(dto);
                if (errors.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Données invalides',
                        errors,
                    });
                }
                const variant = await this.variantService.createVariant(dto);
                return res.status(201).json({
                    success: true,
                    data: variant,
                });
            }
            catch (error) {
                console.error('Error creating variant:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la création du variant',
                });
            }
        };
        /**
         * PATCH /api/variants/:id
         * Mettre à jour un variant
         */
        this.updateVariant = async (req, res) => {
            try {
                const { id } = req.params;
                const dto = Object.assign(new UpdateVariant_1.UpdateVariantDto(), req.body);
                const errors = await (0, class_validator_1.validate)(dto);
                if (errors.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Données invalides',
                        errors,
                    });
                }
                const variant = await this.variantService.updateVariant(id, dto);
                if (!variant) {
                    return res.status(404).json({
                        success: false,
                        message: 'Variant non trouvé',
                    });
                }
                return res.json({
                    success: true,
                    data: variant,
                });
            }
            catch (error) {
                console.error('Error updating variant:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la mise à jour du variant',
                });
            }
        };
        /**
         * DELETE /api/variants/:id
         * Supprimer un variant
         */
        this.deleteVariant = async (req, res) => {
            try {
                const { id } = req.params;
                const success = await this.variantService.deleteVariant(id);
                if (!success) {
                    return res.status(404).json({
                        success: false,
                        message: 'Variant non trouvé',
                    });
                }
                return res.json({
                    success: true,
                    message: 'Variant supprimé avec succès',
                });
            }
            catch (error) {
                console.error('Error deleting variant:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la suppression du variant',
                });
            }
        };
        /**
         * PATCH /api/variants/:id/stock
         * Mettre à jour le stock d'un variant
         */
        this.updateStock = async (req, res) => {
            try {
                const { id } = req.params;
                const { quantity } = req.body;
                if (typeof quantity !== 'number') {
                    return res.status(400).json({
                        success: false,
                        message: 'Quantité invalide',
                    });
                }
                const variant = await this.variantService.updateStock(id, quantity);
                if (!variant) {
                    return res.status(404).json({
                        success: false,
                        message: 'Variant non trouvé',
                    });
                }
                return res.json({
                    success: true,
                    data: variant,
                });
            }
            catch (error) {
                console.error('Error updating stock:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Erreur lors de la mise à jour du stock',
                });
            }
        };
    }
}
exports.VariantController = VariantController;
