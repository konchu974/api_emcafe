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
exports.PasswordResetToken = void 0;
const typeorm_1 = require("typeorm");
const UserAccount_1 = require("./UserAccount");
let PasswordResetToken = class PasswordResetToken {
};
exports.PasswordResetToken = PasswordResetToken;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PasswordResetToken.prototype, "id_token", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'char', length: 36 }),
    __metadata("design:type", String)
], PasswordResetToken.prototype, "id_user_account", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], PasswordResetToken.prototype, "token", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime' }),
    __metadata("design:type", Date)
], PasswordResetToken.prototype, "expires_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], PasswordResetToken.prototype, "used", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PasswordResetToken.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => UserAccount_1.UserAccount, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'id_user_account' }),
    __metadata("design:type", UserAccount_1.UserAccount)
], PasswordResetToken.prototype, "user", void 0);
exports.PasswordResetToken = PasswordResetToken = __decorate([
    (0, typeorm_1.Entity)('password_reset_token')
], PasswordResetToken);
//# sourceMappingURL=PasswordResetToken.js.map