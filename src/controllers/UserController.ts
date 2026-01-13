import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { AuthRequest } from '../middlewares/authMiddleware';
import { LoginDto } from '../dtos/user/LoginDto';

export class UserController {
  private userService = new UserService();

  register = async (req: Request, res: Response) => {
    try {
      const user = await this.userService.register(req.body);
      res.status(201).json(user);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const loginDto: LoginDto = req.body;

      if (!loginDto.email || !loginDto.password) {
        return res.status(400).json({
          success: false,
          message: "Email et mot de passe requis",
        });
      }

      const result = await this.userService.login(loginDto);
      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      res.status(401).json({ success: false, message: err.message });
    }
  };

  getAll = async (_: Request, res: Response) => {
    try {
      res.json(await this.userService.findAll());
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      res.json(await this.userService.findById(req.params.id));
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  };

  getProfile = async (req: AuthRequest, res: Response) => {
    try {
      res.json(await this.userService.findById(req.user.id));
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  };

  updateUser = async (req: Request, res: Response) => {
    try {
      const user = await this.userService.UpdateUser(req.params.id, req.body);
      res.json({ success: true, data: user });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  };

  /* 🆕 UPDATE ADDRESS */
updateAddress = async (req: AuthRequest, res: Response) => {
  try {
    console.log("📩 Received address update body:", req.body);
    console.log("👤 User ID from token:", req.user.id);

    const updated = await this.userService.updateAddress(req.user.id, req.body);

    res.json({
      success: true,
      message: "Adresse mise à jour",
      data: updated,
    });
  } catch (err: any) {
    console.error("❌ updateAddress ERROR:", err);
    res.status(400).json({ success: false, message: err.message });
  }
};


  delete = async (req: Request, res: Response) => {
    try {
      const result = await this.userService.delete(req.params.id);
      res.json(result);
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  };


  /**
   * 🔐 Demande de réinitialisation de mot de passe
   * POST /api/users/request-password-reset
   * Body: { email: string }
   */
  requestPasswordReset = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email requis',
        });
      }

      // Appel au service
      await this.userService.requestPasswordReset(email);

      // ⚠️ Toujours renvoyer un succès (même si email inexistant)
      // pour éviter l'énumération des comptes
      res.status(200).json({
        success: true,
        message: 'Si cet email existe, un code de réinitialisation a été envoyé.',
      });
    } catch (err: any) {
      console.error('❌ requestPasswordReset ERROR:', err);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la demande de réinitialisation',
      });
    }
  };

  /**
   * 🔑 Réinitialisation du mot de passe avec token
   * POST /api/users/reset-password
   * Body: { token: string, newPassword: string }
   */
  resetPassword = async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Token et nouveau mot de passe requis',
        });
      }

      // Validation du mot de passe (optionnel)
      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe doit contenir au moins 8 caractères',
        });
      }

      // Appel au service
      await this.userService.resetPassword(token, newPassword);

      res.status(200).json({
        success: true,
        message: 'Mot de passe réinitialisé avec succès',
      });
    } catch (err: any) {
      console.error('❌ resetPassword ERROR:', err);
      res.status(400).json({
        success: false,
        message: err.message || 'Token invalide ou expiré',
      });
    }
  };
}

