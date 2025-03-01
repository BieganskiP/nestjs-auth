import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { LocalStrategy } from '../strategies/local.strategy';
import { AuthService } from '../auth.service';
import { User, UserStatus } from '../../users/entities/user.entity';
import { Role } from '../enums/role.enum';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: AuthService;

  // Mock user
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
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get<AuthService>(AuthService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return a user when credentials are valid', async () => {
      // Setup
      mockAuthService.validateUser.mockResolvedValue(mockUser);
      const email = 'test@example.com';
      const password = 'password123';

      // Execute
      const result = await strategy.validate(email, password);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        email,
        password,
      );
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      // Setup
      mockAuthService.validateUser.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );
      const email = 'test@example.com';
      const password = 'wrong_password';

      // Execute & Assert
      await expect(strategy.validate(email, password)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        email,
        password,
      );
    });

    it('should throw UnauthorizedException when authService throws any error', async () => {
      // Setup
      mockAuthService.validateUser.mockRejectedValue(
        new Error('Some other error'),
      );
      const email = 'test@example.com';
      const password = 'password123';

      // Execute & Assert
      await expect(strategy.validate(email, password)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        email,
        password,
      );
    });
  });
});
