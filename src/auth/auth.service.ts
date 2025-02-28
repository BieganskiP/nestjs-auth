import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async register(userData: Partial<User>): Promise<User> {
    const user = await this.usersService.create(userData);

    // Generate email verification token
    const verificationToken =
      await this.usersService.createEmailVerificationToken(user.id);

    // Send verification email
    await this.emailService.sendEmailVerification(
      user.email,
      verificationToken,
    );

    return user;
  }

  async verifyEmail(token: string): Promise<boolean> {
    return this.usersService.verifyEmail(token);
  }

  async requestPasswordReset(email: string): Promise<boolean> {
    const resetData = await this.usersService.createPasswordResetToken(email);
    if (!resetData) {
      // We don't want to reveal if the email exists or not for security reasons
      return true;
    }

    await this.emailService.sendPasswordResetEmail(email, resetData.token);
    return true;
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    if (!token || !newPassword) {
      throw new BadRequestException('Token and new password are required');
    }

    return this.usersService.resetPassword(token, newPassword);
  }
}
