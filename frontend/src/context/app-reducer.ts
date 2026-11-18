import { clamp } from "@/lib/utils";
import type { AppState, LocalAppState } from "@/types/store";
import type { Booking } from "@/types/booking";
import type { Category } from "@/types/category";
import type { ItemCondition } from "@/types/return";
import type { Resource } from "@/types/resource";
import type { ReturnRecord } from "@/types/return";
import type { User, UserPreferences } from "@/types/user";

export type AppAction =
  | { type: "hydrate"; state: AppState }
  | { type: "hydrate-local"; state: LocalAppState }
  | { type: "hydrate-catalogue"; categories: Category[]; resources: Resource[] }
  | { type: "upsert-user"; user: User }
  | { type: "create-booking"; booking: Booking }
  | { type: "cancel-booking"; bookingId: string; decisionAt: string }
  | {
      type: "approve-booking";
      bookingId: string;
      notes: string;
      decisionAt: string;
    }
  | {
      type: "reject-booking";
      bookingId: string;
      notes: string;
      decisionAt: string;
    }
  | { type: "create-resource"; resource: Resource }
  | { type: "update-resource"; resource: Resource }
  | { type: "delete-resource"; resourceId: string }
  | { type: "create-category"; category: Category }
  | { type: "update-category"; category: Category }
  | { type: "delete-category"; categoryId: string }
  | { type: "issue-booking"; returnRecord: ReturnRecord }
  | {
      type: "record-return";
      returnRecordId: string;
      actualReturnDate: string;
      returnedQuantity: number;
      condition: ItemCondition;
      notes: string;
    }
  | { type: "update-preferences"; preferences: Partial<UserPreferences> };

function adjustAvailability(
  resources: Resource[],
  resourceId: string,
  delta: number,
): Resource[] {
  return resources.map((resource) =>
    resource.id === resourceId
      ? {
          ...resource,
          availableQuantity: clamp(
            resource.availableQuantity + delta,
            0,
            resource.totalQuantity,
          ),
        }
      : resource,
  );
}

function updateBookingStatus(
  bookings: Booking[],
  bookingId: string,
  update: Partial<Booking>,
): Booking[] {
  return bookings.map((booking) =>
    booking.id === bookingId ? { ...booking, ...update } : booking,
  );
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "hydrate-local":
      return { ...state, ...action.state };
    case "hydrate-catalogue":
      return {
        ...state,
        categories: action.categories,
        resources: action.resources,
      };
    case "upsert-user": {
      const exists = state.users.some((user) => user.id === action.user.id);
      return {
        ...state,
        users: exists
          ? state.users.map((user) =>
              user.id === action.user.id ? action.user : user,
            )
          : [...state.users, action.user],
      };
    }
    case "create-booking":
      return {
        ...state,
        bookings: [action.booking, ...state.bookings],
      };
    case "cancel-booking": {
      const booking = state.bookings.find(
        (item) => item.id === action.bookingId,
      );
      if (!booking) return state;
      const wasApproved = booking.status === "approved";
      return {
        ...state,
        bookings: updateBookingStatus(state.bookings, action.bookingId, {
          status: "cancelled",
          decisionAt: action.decisionAt,
        }),
        resources: wasApproved
          ? adjustAvailability(
              state.resources,
              booking.resourceId,
              booking.quantity,
            )
          : state.resources,
      };
    }
    case "approve-booking": {
      const booking = state.bookings.find(
        (item) => item.id === action.bookingId,
      );
      if (!booking) return state;
      return {
        ...state,
        bookings: updateBookingStatus(state.bookings, action.bookingId, {
          status: "approved",
          adminNotes: action.notes,
          decisionAt: action.decisionAt,
        }),
        resources: adjustAvailability(
          state.resources,
          booking.resourceId,
          -booking.quantity,
        ),
      };
    }
    case "reject-booking":
      return {
        ...state,
        bookings: updateBookingStatus(state.bookings, action.bookingId, {
          status: "rejected",
          adminNotes: action.notes,
          decisionAt: action.decisionAt,
        }),
      };
    case "create-resource":
      return {
        ...state,
        resources: [action.resource, ...state.resources],
      };
    case "update-resource":
      return {
        ...state,
        resources: state.resources.map((resource) =>
          resource.id === action.resource.id ? action.resource : resource,
        ),
      };
    case "delete-resource":
      return {
        ...state,
        resources: state.resources.filter(
          (resource) => resource.id !== action.resourceId,
        ),
      };
    case "create-category":
      return {
        ...state,
        categories: [...state.categories, action.category],
      };
    case "update-category":
      return {
        ...state,
        categories: state.categories.map((category) =>
          category.id === action.category.id ? action.category : category,
        ),
      };
    case "delete-category":
      return {
        ...state,
        categories: state.categories.filter(
          (category) => category.id !== action.categoryId,
        ),
      };
    case "issue-booking": {
      const exists = state.returns.some(
        (record) => record.id === action.returnRecord.id,
      );
      return {
        ...state,
        returns: exists
          ? state.returns.map((record) =>
              record.id === action.returnRecord.id
                ? action.returnRecord
                : record,
            )
          : [...state.returns, action.returnRecord],
      };
    }
    case "record-return": {
      const record = state.returns.find(
        (item) => item.id === action.returnRecordId,
      );
      if (!record) return state;
      const booking = state.bookings.find(
        (item) => item.id === record.bookingId,
      );
      const nextReturned = Math.min(
        record.issuedQuantity,
        record.returnedQuantity + action.returnedQuantity,
      );
      const fullyReturned = nextReturned >= record.issuedQuantity;

      return {
        ...state,
        returns: state.returns.map((item) =>
          item.id === action.returnRecordId
            ? {
                ...item,
                actualReturnDate: action.actualReturnDate,
                returnedQuantity: nextReturned,
                condition: action.condition,
                notes: action.notes,
                status: fullyReturned ? "returned" : "issued",
              }
            : item,
        ),
        resources: booking
          ? adjustAvailability(
              state.resources,
              booking.resourceId,
              action.returnedQuantity,
            )
          : state.resources,
        bookings:
          booking && fullyReturned
            ? updateBookingStatus(state.bookings, booking.id, {
                status: "completed",
              })
            : state.bookings,
      };
    }
    case "update-preferences":
      return {
        ...state,
        preferences: { ...state.preferences, ...action.preferences },
      };
    default:
      return state;
  }
}
