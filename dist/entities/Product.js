"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = exports.RoastLevel = exports.CoffeeType = void 0;
const typeorm_1 = require("typeorm");
const OrderItem_1 = require("./OrderItem");
const ProductVariant_1 = require("./ProductVariant");
var CoffeeType;
(function (CoffeeType) {
    CoffeeType["ARABICA"] = "ARABICA";
    CoffeeType["ROBUSTA"] = "ROBUSTA";
    CoffeeType["BLEND"] = "BLEND";
    CoffeeType["DECAFFEINATED"] = "DECAFFEINATED";
    CoffeeType["ORGANIC"] = "ORGANIC";
})(CoffeeType || (exports.CoffeeType = CoffeeType = {}));
var RoastLevel;
(function (RoastLevel) {
    RoastLevel["LIGHT"] = "LIGHT";
    RoastLevel["MEDIUM"] = "MEDIUM";
    RoastLevel["DARK"] = "DARK";
    RoastLevel["EXTRA_DARK"] = "EXTRA_DARK";
})(RoastLevel || (exports.RoastLevel = RoastLevel = {}));
let Product = class Product {
};
exports.Product = Product;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Product.prototype, "id_product", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Product.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 300, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Product.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)('int', { default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "stock", void 0);
__decorate([
    (0, typeorm_1.Column)('tinyint', { nullable: true, comment: 'Niveau d\'intensité du café (1-10)' }),
    __metadata("design:type", Number)
], Product.prototype, "intensity", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true, comment: 'Format (ex: 250g, 500g, 1kg, 10 capsules)' }),
    __metadata("design:type", String)
], Product.prototype, "format", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: CoffeeType,
        nullable: true,
        comment: 'Type de café'
    }),
    __metadata("design:type", String)
], Product.prototype, "coffee_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true, comment: 'Origine du café (ex: Colombie, Brésil, Éthiopie)' }),
    __metadata("design:type", String)
], Product.prototype, "origin", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: RoastLevel,
        nullable: true,
        comment: 'Niveau de torréfaction'
    }),
    __metadata("design:type", String)
], Product.prototype, "roast_level", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "image_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, default: 'Coffee' }),
    __metadata("design:type", String)
], Product.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)('tinyint', { default: 1 }),
    __metadata("design:type", Number)
], Product.prototype, "is_active", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "size", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 150, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "preparation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 150, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "ingredient", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP'
    }),
    __metadata("design:type", Date)
], Product.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP'
    }),
    __metadata("design:type", Date)
], Product.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => OrderItem_1.OrderItem, (orderItem) => orderItem.product, {
        cascade: false, // ❌ Pas de cascade pour éviter les suppressions accidentelles
        onDelete: 'RESTRICT' // ❌ Empêche la suppression d'un produit si des commandes existent
    }),
    __metadata("design:type", Array)
], Product.prototype, "orderItems", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => ProductVariant_1.ProductVariant, (variant) => variant.product, {
        cascade: true,
        eager: false, // On charge les variants seulement quand nécessaire
    }),
    __metadata("design:type", Array)
], Product.prototype, "variants", void 0);
exports.Product = Product = __decorate([
    (0, typeorm_1.Entity)('product'),
    (0, typeorm_1.Index)(['name', 'category', 'is_active', 'price', 'intensity', 'coffee_type'])
], Product);
