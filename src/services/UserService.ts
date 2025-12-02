import { AppDataSource } from "../config/database";
import { UserAccount } from "../entities/UserAccount";
import { RegisterDto } from "../dtos/user/RegisterDto";
import { LoginDto } from "../dtos/user/LoginDto";
import { UpdateUserDto } from "../dtos/user/UpdateUserDto";
import { hashPassword, comparePassword } from "../utils/hashPassword";
import { generateToken } from "../utils/jwt";

export class UserService {
  private userRepository = AppDataSource.getRepository(UserAccount);

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

    // Assign correctly mapped fields
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
}
