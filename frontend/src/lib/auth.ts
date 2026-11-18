import type { AuthUser } from "@/types/auth";
import type { User, UserRole } from "@/types/user";

export function canUseAdminPortal(role: UserRole): boolean {
  return role === "manager" || role === "admin";
}

export function getPortalPath(role: UserRole): string {
  return canUseAdminPortal(role) ? "/admin/dashboard" : "/dashboard";
}

export function toAppUser(user: AuthUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: "",
    role: user.role,
    department: user.department ?? "",
    phone: user.phone ?? "",
  };
}
