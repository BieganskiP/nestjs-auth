import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedGuard } from '../guards/authenticated.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('AuthenticatedGuard', () => {
  let guard: AuthenticatedGuard;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new AuthenticatedGuard(reflector);

    mockExecutionContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn(),
      }),
    } as unknown as ExecutionContext;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access to public routes', () => {
    // Setup
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    // Execute
    const result = guard.canActivate(mockExecutionContext);

    // Assert
    expect(result).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      mockExecutionContext.getHandler(),
      mockExecutionContext.getClass(),
    ]);
  });

  it('should allow access to authenticated users', () => {
    // Setup
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    mockExecutionContext.switchToHttp().getRequest = jest.fn().mockReturnValue({
      isAuthenticated: jest.fn().mockReturnValue(true),
    });

    // Execute
    const result = guard.canActivate(mockExecutionContext);

    // Assert
    expect(result).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      mockExecutionContext.getHandler(),
      mockExecutionContext.getClass(),
    ]);
  });

  it('should deny access to non-authenticated users', () => {
    // Setup
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    mockExecutionContext.switchToHttp().getRequest = jest.fn().mockReturnValue({
      isAuthenticated: jest.fn().mockReturnValue(false),
    });

    // Execute
    const result = guard.canActivate(mockExecutionContext);

    // Assert
    expect(result).toBe(false);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      mockExecutionContext.getHandler(),
      mockExecutionContext.getClass(),
    ]);
  });
});
