import { apiRequest } from "@/lib/api-client";
import type {
  AuthResponse,
  AuthUser,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from "@/types/auth";

export function login(input: LoginInput): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: input,
  });
}

export function register(input: RegisterInput): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: input,
  });
}

export async function getMe(): Promise<AuthUser> {
  const data = await apiRequest<{ user: AuthUser }>("/auth/me");
  return data.user;
}

export async function updateMe(
  input: UpdateProfileInput,
): Promise<AuthUser> {
  const data = await apiRequest<{ user: AuthUser }>("/auth/me", {
    method: "PUT",
    body: input,
  });
  return data.user;
}
