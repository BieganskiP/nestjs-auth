import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../guards/roles.guard';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;
  let mockRequest: any;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);

    mockRequest = {};
    mockExecutionContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when no roles are required', () => {
    // Setup
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

    // Execute
    const result = guard.canActivate(mockExecutionContext);

    // Assert
    expect(result).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      mockExecutionContext.getHandler(),
      mockExecutionContext.getClass(),
    ]);
  });

  it('should allow access when user has required role', () => {
    // Setup
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.USER]);
    mockRequest.user = { role: Role.USER };

    // Execute
    const result = guard.canActivate(mockExecutionContext);

    // Assert
    expect(result).toBe(true);
  });

  it('should allow access when user has higher role than required', () => {
    // Setup
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.USER]);
    mockRequest.user = { role: Role.ADMIN };

    // Execute
    const result = guard.canActivate(mockExecutionContext);

    // Assert
    expect(result).toBe(true);
  });

  it('should deny access when user has lower role than required', () => {
    // Setup
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    mockRequest.user = { role: Role.USER };

    // Execute
    const result = guard.canActivate(mockExecutionContext);

    // Assert
    expect(result).toBe(false);
  });

  it('should deny access when user is not defined', () => {
    // Setup
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.USER]);
    mockRequest.user = undefined;

    // Execute
    const result = guard.canActivate(mockExecutionContext);

    // Assert
    expect(result).toBe(false);
  });

  it('should deny access when user role is not defined', () => {
    // Setup
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.USER]);
    mockRequest.user = { role: undefined };

    // Execute
    const result = guard.canActivate(mockExecutionContext);

    // Assert
    expect(result).toBe(false);
  });
});
