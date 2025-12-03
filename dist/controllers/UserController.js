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
            catch (err) {
                res.status(400).json({ message: err.message });
            }
        };
        this.login = async (req, res) => {
            try {
                const loginDto = req.body;
                if (!loginDto.email || !loginDto.password) {
                    return res.status(400).json({
                        success: false,
                        message: "Email et mot de passe requis",
                    });
                }
                const result = await this.userService.login(loginDto);
                res.status(200).json({ success: true, data: result });
            }
            catch (err) {
                res.status(401).json({ success: false, message: err.message });
            }
        };
        this.getAll = async (_, res) => {
            try {
                res.json(await this.userService.findAll());
            }
            catch (err) {
                res.status(500).json({ message: err.message });
            }
        };
        this.getById = async (req, res) => {
            try {
                res.json(await this.userService.findById(req.params.id));
            }
            catch (err) {
                res.status(404).json({ message: err.message });
            }
        };
        this.getProfile = async (req, res) => {
            try {
                res.json(await this.userService.findById(req.user.id));
            }
            catch (err) {
                res.status(404).json({ message: err.message });
            }
        };
        this.updateUser = async (req, res) => {
            try {
                const user = await this.userService.UpdateUser(req.params.id, req.body);
                res.json({ success: true, data: user });
            }
            catch (err) {
                res.status(400).json({ success: false, message: err.message });
            }
        };
        /* 🆕 UPDATE ADDRESS */
        this.updateAddress = async (req, res) => {
            try {
                console.log("📩 Received address update body:", req.body);
                console.log("👤 User ID from token:", req.user.id);
                const updated = await this.userService.updateAddress(req.user.id, req.body);
                res.json({
                    success: true,
                    message: "Adresse mise à jour",
                    data: updated,
                });
            }
            catch (err) {
                console.error("❌ updateAddress ERROR:", err);
                res.status(400).json({ success: false, message: err.message });
            }
        };
        this.delete = async (req, res) => {
            try {
                const result = await this.userService.delete(req.params.id);
                res.json(result);
            }
            catch (err) {
                res.status(404).json({ message: err.message });
            }
        };
    }
}
exports.UserController = UserController;
