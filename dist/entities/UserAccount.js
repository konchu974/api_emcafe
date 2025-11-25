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
exports.UserAccount = exports.UserRole = exports.Gender = void 0;
const typeorm_1 = require("typeorm");
const Order_1 = require("./Order");
const PasswordResetToken_1 = require("./PasswordResetToken");
var Gender;
(function (Gender) {
    Gender["MALE"] = "M";
    Gender["FEMALE"] = "F";
    Gender["OTHER"] = "OTHER";
})(Gender || (exports.Gender = Gender = {}));
var UserRole;
(function (UserRole) {
    UserRole["CLIENT"] = "CLIENT";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
let UserAccount = class UserAccount {
};
exports.UserAccount = UserAccount;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], UserAccount.prototype, "id_user_account", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], UserAccount.prototype, "first_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], UserAccount.prototype, "last_name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: Gender,
        nullable: true,
    }),
    __metadata("design:type", String)
], UserAccount.prototype, "gender", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, unique: true }),
    __metadata("design:type", String)
], UserAccount.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], UserAccount.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], UserAccount.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], UserAccount.prototype, "address_line1", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], UserAccount.prototype, "address_line2", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], UserAccount.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], UserAccount.prototype, "postal_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, default: 'France' }),
    __metadata("design:type", String)
], UserAccount.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: UserRole,
        default: UserRole.CLIENT,
    }),
    __metadata("design:type", String)
], UserAccount.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], UserAccount.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], UserAccount.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Order_1.Order, (order) => order.user),
    __metadata("design:type", Array)
], UserAccount.prototype, "orders", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PasswordResetToken_1.PasswordResetToken, (token) => token.user),
    __metadata("design:type", Array)
], UserAccount.prototype, "passwordResetTokens", void 0);
exports.UserAccount = UserAccount = __decorate([
    (0, typeorm_1.Entity)('user_account')
], UserAccount);
//# sourceMappingURL=UserAccount.js.map