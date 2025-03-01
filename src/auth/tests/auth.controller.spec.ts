import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { User, UserStatus } from '../../users/entities/user.entity';
import { Role } from '../enums/role.enum';
import { RegisterDto } from '../dto/register.dto';
import { ResetPasswordRequestDto } from '../dto/reset-password-request.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from '../../users/dto/user-response.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  // Mock user data
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'hashed_password',
    role: Role.USER,
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
    emailVerificationToken: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    hashPassword: jest.fn(),
    validatePassword: jest.fn(),
  };

  // Mock AuthService
  const mockAuthService = {
    register: jest.fn(),
    validateUser: jest.fn(),
    verifyEmail: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user and return a success message', async () => {
      // Setup
      const registerDto: RegisterDto = {
        email: 'new@example.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
      };

      mockAuthService.register.mockResolvedValue({
        ...mockUser,
        id: '2',
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      });

      // Execute
      const result = await controller.register(registerDto);

      // Assert
      expect(result).toEqual({
        message:
          'Registration successful. Please check your email to verify your account.',
        userId: '2',
      });
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    it('should return user data and success message on login', async () => {
      // Setup
      const req = {
        user: mockUser,
      } as any;

      // Execute
      const result = controller.login(req);

      // Assert
      expect(result).toEqual({
        message: 'Login successful',
        user: plainToInstance(UserResponseDto, mockUser),
      });
    });
  });

  describe('logout', () => {
    it('should log out the user and return a success message', () => {
      // Setup
      const logoutMock = jest.fn((callback) => callback());
      const req = {
        logout: logoutMock,
      } as any;

      // Execute
      const result = controller.logout(req);

      // Assert
      expect(result).toEqual({ message: 'Logout successful' });
      expect(logoutMock).toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token and return success message', async () => {
      // Setup
      const token = 'valid_token';
      mockAuthService.verifyEmail.mockResolvedValue(true);

      // Execute
      const result = await controller.verifyEmail(token);

      // Assert
      expect(result).toEqual({
        message: 'Email verification successful. You can now log in.',
      });
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(token);
    });

    it('should return error message for invalid token', async () => {
      // Setup
      const token = 'invalid_token';
      mockAuthService.verifyEmail.mockResolvedValue(false);

      // Execute
      const result = await controller.verifyEmail(token);

      // Assert
      expect(result).toEqual({
        message: 'Invalid or expired verification token.',
      });
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(token);
    });
  });

  describe('forgotPassword', () => {
    it('should process password reset request and return success message', async () => {
      // Setup
      const resetRequestDto: ResetPasswordRequestDto = {
        email: 'test@example.com',
      };
      mockAuthService.requestPasswordReset.mockResolvedValue(true);

      // Execute
      const result = await controller.forgotPassword(resetRequestDto);

      // Assert
      expect(result).toEqual({
        message:
          'If your email is registered, you will receive password reset instructions.',
      });
      expect(mockAuthService.requestPasswordReset).toHaveBeenCalledWith(
        resetRequestDto.email,
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token and return success message', async () => {
      // Setup
      const resetPasswordDto: ResetPasswordDto = {
        token: 'valid_token',
        newPassword: 'NewPassword123!',
      };
      mockAuthService.resetPassword.mockResolvedValue(true);

      // Execute
      const result = await controller.resetPassword(resetPasswordDto);

      // Assert
      expect(result).toEqual({
        message:
          'Password has been reset successfully. You can now log in with your new password.',
      });
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        resetPasswordDto.token,
        resetPasswordDto.newPassword,
      );
    });

    it('should return error message for invalid token', async () => {
      // Setup
      const resetPasswordDto: ResetPasswordDto = {
        token: 'invalid_token',
        newPassword: 'NewPassword123!',
      };
      mockAuthService.resetPassword.mockResolvedValue(false);

      // Execute
      const result = await controller.resetPassword(resetPasswordDto);

      // Assert
      expect(result).toEqual({
        message: 'Invalid or expired reset token.',
      });
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        resetPasswordDto.token,
        resetPasswordDto.newPassword,
      );
    });
  });

  describe('getProfile', () => {
    it('should return the user profile', () => {
      // Setup
      const req = {
        user: mockUser,
      } as any;

      // Execute
      const result = controller.getProfile(req);

      // Assert
      expect(result).toEqual(plainToInstance(UserResponseDto, mockUser));
    });
  });
});
