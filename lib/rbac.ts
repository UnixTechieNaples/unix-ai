export type UserRole = "superadmin" | "developer" | "user";

interface UserPermissions {
  canAccessStudio: boolean;
  canManageNodes: boolean;
  canUseWebhooks: boolean;
  canDeploy: boolean;
}

const rolePermissions: Record<UserRole, UserPermissions> = {
  superadmin: {
    canAccessStudio: true,
    canManageNodes: true,
    canUseWebhooks: true,
    canDeploy: true,
  },
  developer: {
    canAccessStudio: true,
    canManageNodes: true,
    canUseWebhooks: true,
    canDeploy: false,
  },
  user: {
    canAccessStudio: true,
    canManageNodes: false,
    canUseWebhooks: false,
    canDeploy: false,
  }
};

export function checkPermission(role: string, action: keyof UserPermissions): boolean {
  const userRole = (role as UserRole) || "user";
  const permissions = rolePermissions[userRole] || rolePermissions.user;
  return !!permissions[action];
}