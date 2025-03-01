import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserStatus } from '../entities/user.entity';
import { Repository, Not } from 'typeorm';
import { Role } from '../../auth/enums/role.enum';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  // Mock users data
  const mockUsers: User[] = [
    {
      id: '1',
      email: 'user1@example.com',
      firstName: 'John',
      lastName: 'Doe',
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
      validatePassword: jest.fn().mockResolvedValue(true),
    },
    {
      id: '2',
      email: 'user2@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      password: 'hashed_password',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      emailVerificationToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      hashPassword: jest.fn(),
      validatePassword: jest.fn().mockResolvedValue(true),
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
      validatePassword: jest.fn().mockResolvedValue(true),
    },
  ];

  const mockRepository = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users except deleted when includeDeleted is false', async () => {
      // Setup
      mockRepository.find.mockResolvedValue(
        mockUsers.filter((user) => user.status !== UserStatus.DELETED),
      );

      // Execute
      const result = await service.findAll(false);

      // Assert
      expect(result).toEqual(
        mockUsers.filter((user) => user.status !== UserStatus.DELETED),
      );
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { status: Not(UserStatus.DELETED) },
      });
    });

    it('should return all users when includeDeleted is true', async () => {
      // Setup
      mockRepository.find.mockResolvedValue(mockUsers);

      // Execute
      const result = await service.findAll(true);

      // Assert
      expect(result).toEqual(mockUsers);
      expect(mockRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id when user exists and is not deleted', async () => {
      // Setup
      mockRepository.findOneBy.mockResolvedValue(mockUsers[0]);

      // Execute
      const result = await service.findOne('1', false);

      // Assert
      expect(result).toEqual(mockUsers[0]);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        id: '1',
        status: Not(UserStatus.DELETED),
      });
    });

    it('should return null when user does not exist', async () => {
      // Setup
      mockRepository.findOneBy.mockResolvedValue(null);

      // Execute
      const result = await service.findOne('nonexistent-id', false);

      // Assert
      expect(result).toBeNull();
      expect(mockRepository.findOneBy).toHaveBeenCalled();
    });

    it('should include deleted users when includeDeleted is true', async () => {
      // Setup
      mockRepository.findOneBy.mockResolvedValue(mockUsers[2]); // Deleted user

      // Execute
      const result = await service.findOne('3', true);

      // Assert
      expect(result).toEqual(mockUsers[2]);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        id: '3',
      });
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email when user exists and is not deleted', async () => {
      // Setup
      mockRepository.findOneBy.mockResolvedValue(mockUsers[0]);

      // Execute
      const result = await service.findByEmail('user1@example.com', false);

      // Assert
      expect(result).toEqual(mockUsers[0]);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        email: 'user1@example.com',
        status: Not(UserStatus.DELETED),
      });
    });

    it('should return null when user with email does not exist', async () => {
      // Setup
      mockRepository.findOneBy.mockResolvedValue(null);

      // Execute
      const result = await service.findByEmail(
        'nonexistent@example.com',
        false,
      );

      // Assert
      expect(result).toBeNull();
      expect(mockRepository.findOneBy).toHaveBeenCalled();
    });

    it('should include deleted users when includeDeleted is true', async () => {
      // Setup
      mockRepository.findOneBy.mockResolvedValue(mockUsers[2]); // Deleted user

      // Execute
      const result = await service.findByEmail('deleted@example.com', true);

      // Assert
      expect(result).toEqual(mockUsers[2]);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        email: 'deleted@example.com',
      });
    });
  });
});
