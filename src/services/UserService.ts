import { AppDataSource } from "../config/database";
import { UserAccount } from "../entities/UserAccount";
import { PasswordResetToken } from "../entities/PasswordResetToken";
import { RegisterDto } from "../dtos/user/RegisterDto";
import { LoginDto } from "../dtos/user/LoginDto";
import { UpdateUserDto } from "../dtos/user/UpdateUserDto";
import { hashPassword, comparePassword } from "../utils/hashPassword";
import { generateToken } from "../utils/jwt";
import { sendPasswordResetEmail } from "./emailService";

export class UserService {
  private userRepository = AppDataSource.getRepository(UserAccount);
  private passwordResetTokenRepository = AppDataSource.getRepository(PasswordResetToken);

  /* ---------------------------------------------------------
     REGISTER
  --------------------------------------------------------- */
  async register(RegisterDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: RegisterDto.email },
    });

    if (existingUser) throw new Error("Email déjà utilisé");

    const hashedPassword = await hashPassword(RegisterDto.password);

    const user = this.userRepository.create({
      ...RegisterDto,
      password: hashedPassword,
    });

    await this.userRepository.save(user);

    const { password, ...clean } = user;
    return clean;
  }

  /* ---------------------------------------------------------
     LOGIN
  --------------------------------------------------------- */
  async login(LoginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: LoginDto.email },
    });

    if (!user) throw new Error("Email ou mot de passe incorrect");

    const valid = await comparePassword(LoginDto.password, user.password);
    if (!valid) throw new Error("Email ou mot de passe incorrect");

    const token = generateToken({
      id: user.id_user_account,
      email: user.email,
      role: user.role,
    });

    const { password, ...clean } = user;

    return { user: clean, token };
  }

  /* ---------------------------------------------------------
     UPDATE USER PROFILE
  --------------------------------------------------------- */
  async UpdateUser(id: string, dto: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      where: { id_user_account: id },
    });

    if (!user) throw new Error("Utilisateur non trouvé");

    if (dto.email && dto.email !== user.email) {
      const exists = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (exists) throw new Error("Email déjà utilisé");
    }

    Object.assign(user, dto);
    await this.userRepository.save(user);

    const { password, ...clean } = user;
    return clean;
  }

  /* ---------------------------------------------------------
     UPDATE ADDRESS (Checkout)
  --------------------------------------------------------- */
  async updateAddress(
    userId: string,
    data: {
      address_line1: string;
      address_line2?: string;
      city: string;
      postal_code: string;
      country: string;
      phone: string;
    }
  ) {
    const user = await this.userRepository.findOne({
      where: { id_user_account: userId },
    });

    if (!user) throw new Error("Utilisateur non trouvé");

    user.address_line1 = data.address_line1;
    user.address_line2 = data.address_line2;
    user.city = data.city;
    user.postal_code = data.postal_code;
    user.country = data.country;
    user.phone = data.phone;

    await this.userRepository.save(user);

    const { password, ...clean } = user;
    return clean;
  }

  /* ---------------------------------------------------------
     FIND ALL USERS
  --------------------------------------------------------- */
  async findAll() {
    return this.userRepository.find({
      select: [
        "id_user_account",
        "first_name",
        "last_name",
        "email",
        "role",
      ],
    });
  }

  /* ---------------------------------------------------------
     FIND BY ID
  --------------------------------------------------------- */
  async findById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id_user_account: id },
      select: [
        "id_user_account",
        "first_name",
        "last_name",
        "email",
        "role",
        "address_line1",
        "address_line2",
        "city",
        "postal_code",
        "country",
        "phone",
      ],
    });

    if (!user) throw new Error("Utilisateur non trouvé");

    return user;
  }

  /* ---------------------------------------------------------
     DELETE
  --------------------------------------------------------- */
  async delete(id: string) {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) throw new Error("Utilisateur non trouvé");

    return { message: "Utilisateur supprimé" };
  }

  /* ---------------------------------------------------------
     GENERATE RESET TOKEN (6 digits)
  --------------------------------------------------------- */
  private generateResetToken(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /* ---------------------------------------------------------
     REQUEST PASSWORD RESET
  --------------------------------------------------------- */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ 
      where: { email } 
    });

    if (!user) {
      console.warn(`⚠️ Tentative de reset pour email inexistant: ${email}`);
      return;
    }

    await this.passwordResetTokenRepository.update(
      {
        id_user_account: user.id_user_account,
        used: false,
      },
      { used: true }
    );

    const token = this.generateResetToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const resetToken = this.passwordResetTokenRepository.create({
      id_user_account: user.id_user_account,
      token,
      expires_at: expiresAt,
      used: false,
    });

    await this.passwordResetTokenRepository.save(resetToken);

    await sendPasswordResetEmail({
      email: user.email,
      token,
      firstName: user.first_name,
    });

    console.log(`✅ Token de reset envoyé à ${email}`);
  }

  /* ---------------------------------------------------------
     RESET PASSWORD WITH TOKEN
  --------------------------------------------------------- */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: { token },
    });

    if (!resetToken) {
      throw new Error("Token invalide");
    }

    if (new Date() > resetToken.expires_at) {
      throw new Error("Token expiré");
    }

    if (resetToken.used) {
      throw new Error("Token déjà utilisé");
    }

    const hashedPassword = await hashPassword(newPassword);

    await this.userRepository.update(
      { id_user_account: resetToken.id_user_account },
      { password: hashedPassword }
    );

    resetToken.used = true;
    await this.passwordResetTokenRepository.save(resetToken);

    console.log(`✅ Mot de passe réinitialisé pour user ${resetToken.id_user_account}`);
  }
}
