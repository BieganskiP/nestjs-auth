import {
  Controller,
  Get,
  Body,
  Param,
  Delete,
  Put,
  Req,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ParseUUIDPipe,
  Query,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Role } from '../auth/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserResponseDto } from './dto/user-response.dto';
import { Request } from 'express';
import { plainToInstance } from 'class-transformer';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // All authenticated users can access their own profile
  @Get('profile')
  getProfile(@Req() req: Request) {
    return plainToInstance(UserResponseDto, req.user);
  }

  // Leaders and above can view all users
  @Roles(Role.LEADER)
  @Get()
  async findAll(@Query('includeDeleted') includeDeleted?: boolean) {
    const users = await this.usersService.findAll(includeDeleted === true);
    return plainToInstance(UserResponseDto, users);
  }

  // Get user by ID (requires LEADER or above)
  @Roles(Role.LEADER)
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeDeleted') includeDeleted?: boolean,
  ) {
    const user = await this.usersService.findOne(id, includeDeleted === true);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return plainToInstance(UserResponseDto, user);
  }

  // Only admins and owners can update user roles
  @Roles(Role.ADMIN)
  @Put(':id/role')
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string; role: Role };
    const userId = user?.id;
    if (userId === id) {
      throw new BadRequestException('You cannot change your own role');
    }

    const targetUser = await this.usersService.findOne(id);
    if (!targetUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const userRole = user?.role;
    if (
      userRole &&
      targetUser.role &&
      this.usersService.hasHigherRole(targetUser.role as Role, userRole)
    ) {
      throw new UnauthorizedException(
        'You cannot modify users with higher or equal role',
      );
    }

    const updatedUser = await this.usersService.updateUserRole(
      id,
      updateRoleDto.role,
    );
    return plainToInstance(UserResponseDto, updatedUser);
  }

  // Admin can update user status
  @Roles(Role.ADMIN)
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string; role: Role };
    const userId = user?.id;
    if (userId === id) {
      throw new BadRequestException('You cannot change your own status');
    }

    const targetUser = await this.usersService.findOne(id, true);
    if (!targetUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const userRole = user?.role;
    if (
      userRole &&
      targetUser.role &&
      this.usersService.hasHigherRole(targetUser.role as Role, userRole)
    ) {
      throw new UnauthorizedException(
        'You cannot modify users with higher or equal role',
      );
    }

    const updatedUser = await this.usersService.updateStatus(
      id,
      updateStatusDto.status,
    );
    return plainToInstance(UserResponseDto, updatedUser);
  }

  // Admin can block a user
  @Roles(Role.ADMIN)
  @Patch(':id/block')
  async blockUser(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as { id: string; role: Role };
    const userId = user?.id;
    if (userId === id) {
      throw new BadRequestException('You cannot block yourself');
    }

    const targetUser = await this.usersService.findOne(id, true);
    if (!targetUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const userRole = user?.role;
    if (
      userRole &&
      targetUser.role &&
      this.usersService.hasHigherRole(targetUser.role as Role, userRole)
    ) {
      throw new UnauthorizedException(
        'You cannot modify users with higher or equal role',
      );
    }

    const updatedUser = await this.usersService.blockUser(id);
    return plainToInstance(UserResponseDto, updatedUser);
  }

  // Admin can activate a user
  @Roles(Role.ADMIN)
  @Patch(':id/activate')
  async activateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string; role: Role };
    const userId = user?.id;
    if (userId === id) {
      throw new BadRequestException('You cannot activate yourself');
    }

    const targetUser = await this.usersService.findOne(id, true);
    if (!targetUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const userRole = user?.role;
    if (
      userRole &&
      targetUser.role &&
      this.usersService.hasHigherRole(targetUser.role as Role, userRole)
    ) {
      throw new UnauthorizedException(
        'You cannot modify users with higher or equal role',
      );
    }

    const updatedUser = await this.usersService.activateUser(id);
    return plainToInstance(UserResponseDto, updatedUser);
  }

  // Admin can soft delete a user
  @Roles(Role.ADMIN)
  @Delete(':id/soft')
  async softDeleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    const user = req.user as { id: string; role: Role };
    const userId = user?.id;
    if (userId === id) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const targetUser = await this.usersService.findOne(id, true);
    if (!targetUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const userRole = user?.role;
    if (
      userRole &&
      targetUser.role &&
      this.usersService.hasHigherRole(targetUser.role as Role, userRole)
    ) {
      throw new UnauthorizedException(
        'You cannot modify users with higher or equal role',
      );
    }

    const updatedUser = await this.usersService.softDeleteUser(id);
    return plainToInstance(UserResponseDto, updatedUser);
  }

  // Only the owner can permanently delete users
  @Roles(Role.OWNER)
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = req.user as { id: string };
    const userId = user?.id;
    if (userId === id) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const result = await this.usersService.remove(id);
    if (!result.affected) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return {
      message: `User with ID ${id} has been permanently deleted`,
    };
  }
}
