import { clearToken, getToken } from "@/lib/auth-storage";

const FALLBACK_API_URL = "http://localhost:5000/api";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || FALLBACK_API_URL
).replace(/\/+$/, "");

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data?: T;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  token?: string | null;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, token = getToken(), headers, ...rest } = options;
  const requestHeaders = new Headers(headers);

  if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      "Cannot reach the EquipBook server. Check that the backend is running.",
      0,
    );
  }

  let payload: ApiEnvelope<T> | null = null;

  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success) {
    if (response.status === 401 && token) {
      clearToken();

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("equipbook:unauthorized"));
      }
    }

    throw new ApiError(
      payload?.message || "Something went wrong. Please try again.",
      response.status,
    );
  }

  return payload.data as T;
}
