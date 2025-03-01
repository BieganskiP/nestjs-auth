export enum Role {
  USER = 'user',
  LEADER = 'leader',
  ADMIN = 'admin',
  OWNER = 'owner',
}

// Define role hierarchy (higher index = higher privileges)
export const ROLE_HIERARCHY = [Role.USER, Role.LEADER, Role.ADMIN, Role.OWNER];

// Helper function to check if role has required privileges
export function hasRequiredRole(userRole: Role, requiredRole: Role): boolean {
  const userRoleIndex = ROLE_HIERARCHY.indexOf(userRole);
  const requiredRoleIndex = ROLE_HIERARCHY.indexOf(requiredRole);

  return userRoleIndex >= requiredRoleIndex;
}
