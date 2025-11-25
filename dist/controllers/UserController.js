"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const UserService_1 = require("../services/UserService");
class UserController {
    constructor() {
        this.userService = new UserService_1.UserService();
        this.register = async (req, res) => {
            try {
                const user = await this.userService.register(req.body);
                res.status(201).json(user);
            }
            catch (error) {
                res.status(400).json({ message: error.message });
            }
        };
        this.login = async (req, res) => {
            try {
                const loginDto = req.body;
                // Validation
                if (!loginDto.email || !loginDto.password) {
                    res.status(400).json({
                        success: false,
                        message: 'Email et mot de passe requis',
                    });
                    return;
                }
                const result = await this.userService.login(loginDto);
                res.status(200).json({
                    success: true,
                    message: 'Connexion réussie',
                    data: result,
                });
            }
            catch (error) {
                console.error('❌ Erreur lors de la connexion:', error);
                res.status(401).json({
                    success: false,
                    message: error.message || 'Email ou mot de passe incorrect',
                });
            }
        };
        this.getAll = async (req, res) => {
            try {
                const users = await this.userService.findAll();
                res.json(users);
            }
            catch (error) {
                res.status(500).json({ message: error.message });
            }
        };
        this.getById = async (req, res) => {
            try {
                const user = await this.userService.findById(req.params.id);
                res.json(user);
            }
            catch (error) {
                res.status(404).json({ message: error.message });
            }
        };
        this.getProfile = async (req, res) => {
            try {
                const user = await this.userService.findById(req.user.id);
                res.json(user);
            }
            catch (error) {
                res.status(404).json({ message: error.message });
            }
        };
        this.updateUser = async (req, res) => {
            try {
                const user = await this.userService.UpdateUser(req.params.id, req.body);
                res.json({
                    success: true,
                    data: user,
                });
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    message: error.message,
                });
            }
        };
        this.delete = async (req, res) => {
            try {
                const result = await this.userService.delete(req.params.id);
                res.json(result);
            }
            catch (error) {
                res.status(404).json({ message: error.message });
            }
        };
    }
}
exports.UserController = UserController;
//# sourceMappingURL=UserController.js.map