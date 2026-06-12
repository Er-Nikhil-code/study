import { useAuthStore } from "@/store/auth.store";

export function usePermissions() {
  const user = useAuthStore((state) => state.user);

  /**
   * Checks if the user has a specific permission.
   * Admins automatically bypass this check and have all permissions.
   */
  const hasPermission = (permission: string) => {
    if (!user) return false;
    
    // System Admins have absolute power
    if (user.role === "ADMIN") return true;

    // Check custom role permissions
    if (user.custom_role && Array.isArray(user.custom_role.permissions_json)) {
      return user.custom_role.permissions_json.includes(permission);
    }

    return false;
  };

  /**
   * Checks if the user has ANY of the provided permissions.
   */
  const hasAnyPermission = (permissions: string[]) => {
    if (!user) return false;
    if (user.role === "ADMIN") return true;

    if (user.custom_role && Array.isArray(user.custom_role.permissions_json)) {
      return permissions.some(p => user.custom_role?.permissions_json.includes(p));
    }

    return false;
  };

  return { hasPermission, hasAnyPermission, user };
}
