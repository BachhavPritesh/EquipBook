import type { Booking } from "./booking";
import type { Category } from "./category";
import type { Resource } from "./resource";
import type { ReturnRecord } from "./return";
import type { User, UserPreferences } from "./user";

export interface AppState {
  resources: Resource[];
  bookings: Booking[];
  categories: Category[];
  users: User[];
  returns: ReturnRecord[];
  preferences: UserPreferences;
}

export type LocalAppState = Pick<
  AppState,
  "bookings" | "returns" | "preferences" | "users"
>;

export interface ActionResult {
  success: boolean;
  message: string;
}
