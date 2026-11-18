"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ApiError } from "@/lib/api-client";
import { clearToken, getToken, setToken } from "@/lib/auth-storage";
import {
  getMe,
  login as loginRequest,
  register as registerRequest,
  updateMe,
} from "@/services/auth.api";
import type {
  AuthStatus,
  AuthUser,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from "@/types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  login: (input: LoginInput) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => void;
  updateProfile: (input: UpdateProfileInput) => Promise<AuthUser>;
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const token = getToken();

    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(null);
      setStatus("unauthenticated");
      return () => {
        active = false;
      };
    }

    setStatus("loading");

    getMe()
      .then((nextUser) => {
        if (!active) return;
        setUser(nextUser);
        setStatus("authenticated");
      })
      .catch((error: unknown) => {
        if (!active) return;

        if (
          error instanceof ApiError &&
          (error.status === 401 || error.status === 403)
        ) {
          clearToken();
          setUser(null);
          setStatus("unauthenticated");
          return;
        }

        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearToken();
      setUser(null);
      setStatus("unauthenticated");
    };

    window.addEventListener("equipbook:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("equipbook:unauthorized", handleUnauthorized);
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const result = await loginRequest(input);
    setToken(result.token);
    setUser(result.user);
    setStatus("authenticated");
    return result.user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const result = await registerRequest(input);
    setToken(result.token);
    setUser(result.user);
    setStatus("authenticated");
    return result.user;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const updateProfile = useCallback(async (input: UpdateProfileInput) => {
    const nextUser = await updateMe(input);
    setUser(nextUser);
    return nextUser;
  }, []);

  const retry = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      login,
      register,
      logout,
      updateProfile,
      retry,
    }),
    [user, status, login, register, logout, updateProfile, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
