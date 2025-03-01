import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import { User, UserStatus } from '../entities/user.entity';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from '../dto/user-response.dto';
import { Role } from '../../auth/enums/role.enum';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { Request } from 'express';

describe('UsersController', () => {
  let controller: UsersController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let usersService: UsersService;

  // Create mock user data
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
  ];

  // Mock UsersService
  const mockUsersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updateUserRole: jest.fn(),
    updateStatus: jest.fn(),
    blockUser: jest.fn(),
    activateUser: jest.fn(),
    softDeleteUser: jest.fn(),
    hasHigherRole: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      // Setup
      mockUsersService.findAll.mockResolvedValue(mockUsers);

      // Execute
      const result = await controller.findAll(false);

      // Assert
      expect(result).toEqual(plainToInstance(UserResponseDto, mockUsers));
      expect(mockUsersService.findAll).toHaveBeenCalledWith(false);
    });

    it('should include deleted users when includeDeleted is true', async () => {
      // Setup
      mockUsersService.findAll.mockResolvedValue(mockUsers);

      // Execute
      const result = await controller.findAll(true);

      // Assert
      expect(result).toEqual(plainToInstance(UserResponseDto, mockUsers));
      expect(mockUsersService.findAll).toHaveBeenCalledWith(true);
    });
  });

  describe('findOne', () => {
    it('should return a single user when user exists', async () => {
      // Setup
      const userId = '1';
      mockUsersService.findOne.mockResolvedValue(mockUsers[0]);

      // Execute
      const result = await controller.findOne(userId, false);

      // Assert
      expect(result).toEqual(plainToInstance(UserResponseDto, mockUsers[0]));
      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId, false);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Setup
      const userId = 'nonexistent-id';
      mockUsersService.findOne.mockResolvedValue(null);

      // Execute & Assert
      await expect(controller.findOne(userId, false)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId, false);
    });

    it('should include deleted users when includeDeleted is true', async () => {
      // Setup
      const userId = '1';
      mockUsersService.findOne.mockResolvedValue(mockUsers[0]);

      // Execute
      const result = await controller.findOne(userId, true);

      // Assert
      expect(result).toEqual(plainToInstance(UserResponseDto, mockUsers[0]));
      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId, true);
    });
  });

  describe('updateRole', () => {
    const updateRoleDto: UpdateRoleDto = { role: Role.LEADER };
    const adminUser = { id: '3', role: Role.ADMIN };
    const mockRequest = { user: adminUser } as unknown as Request;

    it('should update a user role successfully', async () => {
      // Setup
      const userId = '1';
      const updatedUser = { ...mockUsers[0], role: Role.LEADER };
      mockUsersService.findOne.mockResolvedValue(mockUsers[0]);
      mockUsersService.hasHigherRole.mockReturnValue(false);
      mockUsersService.updateUserRole.mockResolvedValue(updatedUser);

      // Execute
      const result = await controller.updateRole(
        userId,
        updateRoleDto,
        mockRequest,
      );

      // Assert
      expect(result).toEqual(plainToInstance(UserResponseDto, updatedUser));
      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId);
      expect(mockUsersService.updateUserRole).toHaveBeenCalledWith(
        userId,
        Role.LEADER,
      );
    });

    it('should throw BadRequestException when user tries to change their own role', async () => {
      // Setup
      const userId = '3'; // same as admin user ID
      const selfRequest = { user: adminUser } as unknown as Request;

      // Execute & Assert
      await expect(
        controller.updateRole(userId, updateRoleDto, selfRequest),
      ).rejects.toThrow(BadRequestException);
      expect(mockUsersService.findOne).not.toHaveBeenCalled();
      expect(mockUsersService.updateUserRole).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when target user does not exist', async () => {
      // Setup
      const userId = 'nonexistent-id';
      mockUsersService.findOne.mockResolvedValue(null);

      // Execute & Assert
      await expect(
        controller.updateRole(userId, updateRoleDto, mockRequest),
      ).rejects.toThrow(NotFoundException);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId);
      expect(mockUsersService.updateUserRole).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when trying to modify user with higher role', async () => {
      // Setup
      const userId = '2'; // Admin user from mockUsers
      mockUsersService.findOne.mockResolvedValue(mockUsers[1]);
      mockUsersService.hasHigherRole.mockReturnValue(true);

      // Execute & Assert
      await expect(
        controller.updateRole(userId, updateRoleDto, mockRequest),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId);
      expect(mockUsersService.hasHigherRole).toHaveBeenCalled();
      expect(mockUsersService.updateUserRole).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    const updateStatusDto = { status: UserStatus.BLOCKED };
    const adminUser = { id: '3', role: Role.ADMIN };
    const mockRequest = { user: adminUser } as unknown as Request;

    it('should update a user status successfully', async () => {
      // Setup
      const userId = '1';
      const updatedUser = { ...mockUsers[0], status: UserStatus.BLOCKED };
      mockUsersService.findOne.mockResolvedValue(mockUsers[0]);
      mockUsersService.hasHigherRole.mockReturnValue(false);
      mockUsersService.updateStatus.mockResolvedValue(updatedUser);

      // Execute
      const result = await controller.updateStatus(
        userId,
        updateStatusDto,
        mockRequest,
      );

      // Assert
      expect(result).toEqual(plainToInstance(UserResponseDto, updatedUser));
      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId, true);
      expect(mockUsersService.updateStatus).toHaveBeenCalledWith(
        userId,
        UserStatus.BLOCKED,
      );
    });

    it('should throw BadRequestException when user tries to change their own status', async () => {
      // Setup
      const userId = '3'; // same as admin user ID
      const selfRequest = { user: adminUser } as unknown as Request;

      // Execute & Assert
      await expect(
        controller.updateStatus(userId, updateStatusDto, selfRequest),
      ).rejects.toThrow(BadRequestException);
      expect(mockUsersService.findOne).not.toHaveBeenCalled();
      expect(mockUsersService.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when target user does not exist', async () => {
      // Setup
      const userId = 'nonexistent-id';
      mockUsersService.findOne.mockResolvedValue(null);

      // Execute & Assert
      await expect(
        controller.updateStatus(userId, updateStatusDto, mockRequest),
      ).rejects.toThrow(NotFoundException);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId, true);
      expect(mockUsersService.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when trying to modify user with higher role', async () => {
      // Setup
      const userId = '2'; // Admin user from mockUsers
      mockUsersService.findOne.mockResolvedValue(mockUsers[1]);
      mockUsersService.hasHigherRole.mockReturnValue(true);

      // Execute & Assert
      await expect(
        controller.updateStatus(userId, updateStatusDto, mockRequest),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId, true);
      expect(mockUsersService.hasHigherRole).toHaveBeenCalled();
      expect(mockUsersService.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe('blockUser', () => {
    const adminUser = { id: '3', role: Role.ADMIN };
    const mockRequest = { user: adminUser } as unknown as Request;

    it('should block a user successfully', async () => {
      // Setup
      const userId = '1';
      const blockedUser = { ...mockUsers[0], status: UserStatus.BLOCKED };
      mockUsersService.findOne.mockResolvedValue(mockUsers[0]);
      mockUsersService.hasHigherRole.mockReturnValue(false);
      mockUsersService.blockUser.mockResolvedValue(blockedUser);

      // Execute
      const result = await controller.blockUser(userId, mockRequest);

      // Assert
      expect(result).toEqual(plainToInstance(UserResponseDto, blockedUser));
      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId, true);
      expect(mockUsersService.blockUser).toHaveBeenCalledWith(userId);
    });

    it('should throw BadRequestException when user tries to block themselves', async () => {
      // Setup
      const userId = '3'; // same as admin user ID
      const selfRequest = { user: adminUser } as unknown as Request;

      // Execute & Assert
      await expect(controller.blockUser(userId, selfRequest)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUsersService.findOne).not.toHaveBeenCalled();
      expect(mockUsersService.blockUser).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when target user does not exist', async () => {
      // Setup
      const userId = 'nonexistent-id';
      mockUsersService.findOne.mockResolvedValue(null);

      // Execute & Assert
      await expect(controller.blockUser(userId, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId, true);
      expect(mockUsersService.blockUser).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when trying to block user with higher role', async () => {
      // Setup
      const userId = '2'; // Admin user from mockUsers
      mockUsersService.findOne.mockResolvedValue(mockUsers[1]);
      mockUsersService.hasHigherRole.mockReturnValue(true);

      // Execute & Assert
      await expect(controller.blockUser(userId, mockRequest)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId, true);
      expect(mockUsersService.hasHigherRole).toHaveBeenCalled();
      expect(mockUsersService.blockUser).not.toHaveBeenCalled();
    });
  });

  describe('activateUser', () => {
    const adminUser = { id: '3', role: Role.ADMIN };
    const mockRequest = { user: adminUser } as unknown as Request;

    it('should activate a user successfully', async () => {
      // Setup
      const userId = '1';
      const activatedUser = { ...mockUsers[0], status: UserStatus.ACTIVE };
      mockUsersService.findOne.mockResolvedValue(mockUsers[0]);
      mockUsersService.hasHigherRole.mockReturnValue(false);
      mockUsersService.activateUser.mockResolvedValue(activatedUser);

      // Execute
      const result = await controller.activateUser(userId, mockRequest);

      // Assert
      expect(result).toEqual(plainToInstance(UserResponseDto, activatedUser));
      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId, true);
      expect(mockUsersService.activateUser).toHaveBeenCalledWith(userId);
    });

    it('should throw BadRequestException when user tries to activate themselves', async () => {
      // Setup
      const userId = '3'; // same as admin user ID
      const selfRequest = { user: adminUser } as unknown as Request;

      // Execute & Assert
      await expect(
        controller.activateUser(userId, selfRequest),
      ).rejects.toThrow(BadRequestException);
      expect(mockUsersService.findOne).not.toHaveBeenCalled();
      expect(mockUsersService.activateUser).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when target user does not exist', async () => {
      // Setup
      const userId = 'nonexistent-id';
      mockUsersService.findOne.mockResolvedValue(null);

      // Execute & Assert
      await expect(
        controller.activateUser(userId, mockRequest),
      ).rejects.toThrow(NotFoundException);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId, true);
      expect(mockUsersService.activateUser).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when trying to activate user with higher role', async () => {
      // Setup
      const userId = '2'; // Admin user from mockUsers
      mockUsersService.findOne.mockResolvedValue(mockUsers[1]);
      mockUsersService.hasHigherRole.mockReturnValue(true);

      // Execute & Assert
      await expect(
        controller.activateUser(userId, mockRequest),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId, true);
      expect(mockUsersService.hasHigherRole).toHaveBeenCalled();
      expect(mockUsersService.activateUser).not.toHaveBeenCalled();
    });
  });

  describe('softDeleteUser', () => {
    const adminUser = { id: '3', role: Role.ADMIN };
    const mockRequest = { user: adminUser } as unknown as Request;

    it('should soft delete a user successfully', async () => {
      // Setup
      const userId = '1';
      const deletedUser = { ...mockUsers[0], status: UserStatus.DELETED };
      mockUsersService.findOne.mockResolvedValue(mockUsers[0]);
      mockUsersService.hasHigherRole.mockReturnValue(false);
      mockUsersService.softDeleteUser.mockResolvedValue(deletedUser);

      // Execute
      const result = await controller.softDeleteUser(userId, mockRequest);

      // Assert
      expect(result).toEqual(plainToInstance(UserResponseDto, deletedUser));
      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId, true);
      expect(mockUsersService.softDeleteUser).toHaveBeenCalledWith(userId);
    });

    it('should throw BadRequestException when user tries to delete themselves', async () => {
      // Setup
      const userId = '3'; // same as admin user ID
      const selfRequest = { user: adminUser } as unknown as Request;

      // Execute & Assert
      await expect(
        controller.softDeleteUser(userId, selfRequest),
      ).rejects.toThrow(BadRequestException);
      expect(mockUsersService.findOne).not.toHaveBeenCalled();
      expect(mockUsersService.softDeleteUser).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when target user does not exist', async () => {
      // Setup
      const userId = 'nonexistent-id';
      mockUsersService.findOne.mockResolvedValue(null);

      // Execute & Assert
      await expect(
        controller.softDeleteUser(userId, mockRequest),
      ).rejects.toThrow(NotFoundException);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId, true);
      expect(mockUsersService.softDeleteUser).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when trying to delete user with higher role', async () => {
      // Setup
      const userId = '2'; // Admin user from mockUsers
      mockUsersService.findOne.mockResolvedValue(mockUsers[1]);
      mockUsersService.hasHigherRole.mockReturnValue(true);

      // Execute & Assert
      await expect(
        controller.softDeleteUser(userId, mockRequest),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(userId, true);
      expect(mockUsersService.hasHigherRole).toHaveBeenCalled();
      expect(mockUsersService.softDeleteUser).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const ownerUser = { id: '4', role: Role.OWNER };
    const mockRequest = { user: ownerUser } as unknown as Request;

    it('should permanently delete a user successfully', async () => {
      // Setup
      const userId = '1';
      mockUsersService.remove.mockResolvedValue({ affected: 1 });

      // Execute
      const result = await controller.remove(userId, mockRequest);

      // Assert
      expect(result).toEqual({
        message: `User with ID ${userId} has been permanently deleted`,
      });
      expect(mockUsersService.remove).toHaveBeenCalledWith(userId);
    });

    it('should throw BadRequestException when user tries to delete themselves', async () => {
      // Setup
      const userId = '4'; // same as owner user ID
      const selfRequest = { user: ownerUser } as unknown as Request;

      // Execute & Assert
      await expect(controller.remove(userId, selfRequest)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUsersService.remove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when no user was deleted', async () => {
      // Setup
      const userId = 'nonexistent-id';
      mockUsersService.remove.mockResolvedValue({ affected: 0 });

      // Execute & Assert
      await expect(controller.remove(userId, mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUsersService.remove).toHaveBeenCalledWith(userId);
    });
  });
});
