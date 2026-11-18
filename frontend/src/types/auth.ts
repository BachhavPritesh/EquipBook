import type { UserRole } from "./user";

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "error";

export type SelfRegisterRole = Extract<
  UserRole,
  "student" | "employee" | "faculty"
>;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: SelfRegisterRole;
  department?: string;
  phone?: string;
}

export interface UpdateProfileInput {
  name: string;
  department: string;
  phone: string;
}
