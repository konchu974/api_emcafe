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
exports.CreateOrderDto = exports.CreateOrderItemDto = void 0;
// src/dtos/order/CreateOrderDto.ts
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateOrderItemDto {
}
exports.CreateOrderItemDto = CreateOrderItemDto;
__decorate([
    (0, class_validator_1.IsUUID)(undefined, { message: 'id_product doit être un UUID valide' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'id_product est requis' }),
    __metadata("design:type", String)
], CreateOrderItemDto.prototype, "id_product", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(undefined, { message: 'id_variant doit être un UUID valide' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'id_variant est requis' }),
    __metadata("design:type", String)
], CreateOrderItemDto.prototype, "id_variant", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'quantity doit être un nombre' }),
    (0, class_validator_1.Min)(1, { message: 'La quantité doit être au minimum 1' }),
    __metadata("design:type", Number)
], CreateOrderItemDto.prototype, "quantity", void 0);
class CreateOrderDto {
}
exports.CreateOrderDto = CreateOrderDto;
__decorate([
    (0, class_validator_1.IsUUID)(undefined, { message: 'id_user_account doit être un UUID valide' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'id_user_account est requis' }),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "id_user_account", void 0);
__decorate([
    (0, class_validator_1.IsArray)({ message: 'items doit être un tableau' }),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'Au moins un article est requis' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateOrderItemDto),
    __metadata("design:type", Array)
], CreateOrderDto.prototype, "items", void 0);
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'Email invalide' }),
    (0, class_validator_1.IsNotEmpty)({ message: "L'email est requis" }),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: "L'adresse de livraison est requise" }),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "delivery_address", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'La ville de livraison est requise' }),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "delivery_city", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le code postal de livraison est requis' }),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "delivery_postal_code", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le pays de livraison est requis' }),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "delivery_country", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Le téléphone de livraison est requis' }),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "delivery_phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateOrderDto.prototype, "is_relay_delivery", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "relay_point_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "relay_point_name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "relay_carrier", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "notes", void 0);
