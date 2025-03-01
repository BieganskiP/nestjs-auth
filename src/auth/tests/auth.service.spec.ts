import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { EmailService } from '../../email/email.service';
import { User, UserStatus } from '../../users/entities/user.entity';
import { Role } from '../enums/role.enum';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let emailService: EmailService;

  // Mock users
  const mockUsers: User[] = [
    {
      id: '1',
      email: 'active@example.com',
      firstName: 'Active',
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
      validatePassword: jest
        .fn()
        .mockImplementation((pass) =>
          Promise.resolve(pass === 'correct_password'),
        ),
    },
    {
      id: '2',
      email: 'blocked@example.com',
      firstName: 'Blocked',
      lastName: 'User',
      password: 'hashed_password',
      role: Role.USER,
      status: UserStatus.BLOCKED,
      isEmailVerified: true,
      emailVerificationToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      hashPassword: jest.fn(),
      validatePassword: jest
        .fn()
        .mockImplementation((pass) =>
          Promise.resolve(pass === 'correct_password'),
        ),
    },
    {
      id: '3',
      email: 'deleted@example.com',
      firstName: 'Deleted',
      lastName: 'User',
      password: 'hashed_password',
      role: Role.USER,
      status: UserStatus.DELETED,
      isEmailVerified: true,
      emailVerificationToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      hashPassword: jest.fn(),
      validatePassword: jest
        .fn()
        .mockImplementation((pass) =>
          Promise.resolve(pass === 'correct_password'),
        ),
    },
  ];

  // Mock services
  const mockUsersService = {
    findByEmail: jest.fn(),
    createEmailVerificationToken: jest.fn(),
    verifyEmail: jest.fn(),
    createPasswordResetToken: jest.fn(),
    resetPassword: jest.fn(),
    create: jest.fn(),
  };

  const mockEmailService = {
    sendEmailVerification: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    emailService = module.get<EmailService>(EmailService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid and user is active', async () => {
      // Setup
      mockUsersService.findByEmail.mockResolvedValue(mockUsers[0]);

      // Execute
      const result = await service.validateUser(
        'active@example.com',
        'correct_password',
      );

      // Assert
      expect(result).toEqual(mockUsers[0]);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'active@example.com',
      );
    });

    it('should throw UnauthorizedException when user is blocked', async () => {
      // Setup
      mockUsersService.findByEmail.mockResolvedValue(mockUsers[1]);

      // Execute & Assert
      await expect(
        service.validateUser('blocked@example.com', 'correct_password'),
      ).rejects.toThrow(
        new UnauthorizedException(
          'Your account has been blocked. Please contact support.',
        ),
      );
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'blocked@example.com',
      );
    });

    it('should throw UnauthorizedException when user is deleted', async () => {
      // Setup
      mockUsersService.findByEmail.mockResolvedValue(mockUsers[2]);

      // Execute & Assert
      await expect(
        service.validateUser('deleted@example.com', 'correct_password'),
      ).rejects.toThrow(
        new UnauthorizedException('Your account has been deleted.'),
      );
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'deleted@example.com',
      );
    });

    it('should throw UnauthorizedException when password is incorrect', async () => {
      // Setup
      mockUsersService.findByEmail.mockResolvedValue(mockUsers[0]);

      // Execute & Assert
      await expect(
        service.validateUser('active@example.com', 'wrong_password'),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'active@example.com',
      );
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      // Setup
      mockUsersService.findByEmail.mockResolvedValue(null);

      // Execute & Assert
      await expect(
        service.validateUser('nonexistent@example.com', 'any_password'),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'nonexistent@example.com',
      );
    });
  });
});
