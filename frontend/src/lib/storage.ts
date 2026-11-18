import { STORAGE_KEY, STORAGE_VERSION } from "@/lib/constants";
import { createInitialState } from "@/lib/mock-data";
import type { AppState, LocalAppState } from "@/types/store";

const VERSIONED_KEY = `${STORAGE_KEY}.v${STORAGE_VERSION}`;

interface PersistedPayload {
  version: number;
  savedAt: string;
  state: LocalAppState;
}

function isLocalAppState(value: unknown): value is LocalAppState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LocalAppState>;
  return (
    Array.isArray(candidate.bookings) &&
    Array.isArray(candidate.users) &&
    Array.isArray(candidate.returns) &&
    typeof candidate.preferences === "object" &&
    candidate.preferences !== null
  );
}

export function loadAppState(): LocalAppState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(VERSIONED_KEY);
    if (!raw) return null;

    const payload = JSON.parse(raw) as PersistedPayload;
    if (payload.version !== STORAGE_VERSION || !isLocalAppState(payload.state)) {
      return null;
    }

    const fallback = createInitialState();
    return {
      bookings: payload.state.bookings,
      users: payload.state.users,
      returns: payload.state.returns,
      preferences: {
        ...fallback.preferences,
        ...payload.state.preferences,
      },
    };
  } catch {
    return null;
  }
}

export function saveAppState(state: AppState): void {
  if (typeof window === "undefined") return;

  try {
    const local: LocalAppState = {
      bookings: state.bookings,
      users: state.users,
      returns: state.returns,
      preferences: state.preferences,
    };
    const payload: PersistedPayload = {
      version: STORAGE_VERSION,
      savedAt: new Date().toISOString(),
      state: local,
    };
    window.localStorage.setItem(VERSIONED_KEY, JSON.stringify(payload));
  } catch {
    // Storage can be unavailable in private browsing or when the quota is full.
  }
}

export function clearAppState(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(VERSIONED_KEY);
  } catch {
    // Ignore unavailable storage.
  }
}
