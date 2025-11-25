"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const database_1 = require("../config/database");
const UserAccount_1 = require("../entities/UserAccount");
const hashPassword_1 = require("../utils/hashPassword");
const jwt_1 = require("../utils/jwt");
class UserService {
    constructor() {
        this.userRepository = database_1.AppDataSource.getRepository(UserAccount_1.UserAccount);
    }
    async register(RegisterDto) {
        const existingUser = await this.userRepository.findOne({
            where: { email: RegisterDto.email },
        });
        if (existingUser) {
            throw new Error('Email déjà utilisé');
        }
        const hashedPassword = await (0, hashPassword_1.hashPassword)(RegisterDto.password);
        const user = this.userRepository.create({
            ...RegisterDto,
            password: hashedPassword,
        });
        await this.userRepository.save(user);
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async login(LoginDto) {
        const user = await this.userRepository.findOne({ where: { email: LoginDto.email } });
        if (!user) {
            throw new Error('Email ou mot de passe incorrect');
        }
        const isValidPassword = await (0, hashPassword_1.comparePassword)(LoginDto.password, user.password);
        if (!isValidPassword) {
            throw new Error('Email ou mot de passe incorrect');
        }
        const token = (0, jwt_1.generateToken)({
            id: user.id_user_account,
            email: user.email,
            role: user.role,
        });
        const { password: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }
    async UpdateUser(id, updateUserDto) {
        const user = await this.userRepository.findOne({
            where: { id_user_account: id },
        });
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }
        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const existingUser = await this.userRepository.findOne({
                where: { email: updateUserDto.email },
            });
            if (existingUser) {
                throw new Error('Email déjà utilisé');
            }
        }
        Object.assign(user, updateUserDto);
        await this.userRepository.save(user);
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async deleteUser(id) {
        const result = await this.userRepository.delete(id);
        if (result.affected === 0) {
            throw new Error('Utilisateur non trouvé');
        }
        return { message: 'Utilisateur supprimé avec succès' };
    }
    async findAll() {
        return await this.userRepository.find({
            select: ['id_user_account', 'first_name', 'last_name', 'email', 'role'],
        });
    }
    async findById(id) {
        const user = await this.userRepository.findOne({
            where: { id_user_account: id },
            select: ['id_user_account', 'first_name', 'last_name', 'email', 'role'],
        });
        if (!user) {
            throw new Error('Utilisateur non trouvé');
        }
        return user;
    }
    async delete(id) {
        const result = await this.userRepository.delete(id);
        if (result.affected === 0) {
            throw new Error('Utilisateur non trouvé');
        }
        return { message: 'Utilisateur supprimé' };
    }
}
exports.UserService = UserService;
//# sourceMappingURL=UserService.js.map