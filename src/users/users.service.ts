import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, DeleteResult, Not } from 'typeorm';
import { User, UserStatus } from './entities/user.entity';
import * as crypto from 'crypto';
import { Role, ROLE_HIERARCHY } from '../auth/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(includeDeleted = false): Promise<User[]> {
    if (includeDeleted) {
      return this.usersRepository.find();
    }
    return this.usersRepository.find({
      where: { status: Not(UserStatus.DELETED) },
    });
  }

  async findOne(id: string, includeDeleted = false): Promise<User | null> {
    if (includeDeleted) {
      return this.usersRepository.findOneBy({ id });
    }
    return this.usersRepository.findOneBy({
      id,
      status: Not(UserStatus.DELETED),
    });
  }

  async findByEmail(
    email: string,
    includeDeleted = false,
  ): Promise<User | null> {
    if (includeDeleted) {
      return this.usersRepository.findOneBy({ email });
    }
    return this.usersRepository.findOneBy({
      email,
      status: Not(UserStatus.DELETED),
    });
  }

  async create(userData: Partial<User>): Promise<User> {
    if (!userData.email) {
      throw new ConflictException('Email is required');
    }

    const existingUser = await this.findByEmail(userData.email, true);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Ensure new users are active
    userData.status = UserStatus.ACTIVE;
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    const existingUser = await this.findOne(id);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }
    await this.usersRepository.update(id, userData);
    const updatedUser = await this.findOne(id);
    if (!updatedUser) {
      throw new NotFoundException('User not found after update');
    }
    return updatedUser;
  }

  async remove(id: string): Promise<DeleteResult> {
    return this.usersRepository.delete(id);
  }

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    const user = await this.findOne(id, true);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.status = status;
    return this.usersRepository.save(user);
  }

  async blockUser(id: string): Promise<User> {
    return this.updateStatus(id, UserStatus.BLOCKED);
  }

  async softDeleteUser(id: string): Promise<User> {
    return this.updateStatus(id, UserStatus.DELETED);
  }

  async activateUser(id: string): Promise<User> {
    return this.updateStatus(id, UserStatus.ACTIVE);
  }

  async createPasswordResetToken(
    email: string,
  ): Promise<{ token: string; expires: Date } | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Token expires in 1 hour

    user.passwordResetToken = token;
    user.passwordResetExpires = expires;
    await this.usersRepository.save(user);

    return { token, expires };
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: MoreThan(new Date()),
      },
    });

    if (!user) {
      return false;
    }

    user.password = newPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await this.usersRepository.save(user);

    return true;
  }

  async createEmailVerificationToken(userId: string): Promise<string> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const token = crypto.randomBytes(32).toString('hex');

    user.emailVerificationToken = token;
    await this.usersRepository.save(user);

    return token;
  }

  async verifyEmail(token: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return false;
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    await this.usersRepository.save(user);

    return true;
  }

  async updateUserRole(id: string, role: Role): Promise<User> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = role;
    return this.usersRepository.save(user);
  }

  // Helper method to check if one role is higher than another
  hasHigherRole(role1: Role, role2: Role): boolean {
    const role1Index = ROLE_HIERARCHY.indexOf(role1);
    const role2Index = ROLE_HIERARCHY.indexOf(role2);

    return role1Index >= role2Index;
  }
}
