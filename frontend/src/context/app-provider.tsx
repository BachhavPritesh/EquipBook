"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { format } from "date-fns";

import { useAuth } from "@/context/auth-provider";
import { getApiErrorMessage } from "@/lib/api-client";
import { toAppUser } from "@/lib/auth";
import { createInitialState } from "@/lib/mock-data";
import { clearAppState, loadAppState, saveAppState } from "@/lib/storage";
import { generateId } from "@/lib/utils";
import {
  generateBookingReference,
  getAvailabilityPreview,
  getCancelEligibility,
  validateBookingWindow,
} from "@/services/booking.service";
import {
  createCategory as createCategoryRequest,
  deleteCategory as deleteCategoryRequest,
  updateCategory as updateCategoryRequest,
} from "@/services/category.api";
import {
  createResource as createResourceRequest,
  deleteResource as deleteResourceRequest,
  updateResource as updateResourceRequest,
} from "@/services/resource.api";
import { listCategories } from "@/services/category.api";
import { listResources } from "@/services/resource.api";
import { getReturnForBooking } from "@/services/return.service";
import type { Booking, CreateBookingInput } from "@/types/booking";
import type { CategoryInput } from "@/types/category";
import type { ActionResult, AppState } from "@/types/store";
import type { IssueInput, ReturnInput } from "@/types/return";
import type { Resource, ResourceInput } from "@/types/resource";
import type { ProfileFormValues, User, UserPreferences } from "@/types/user";
import { appReducer } from "./app-reducer";

interface CreateBookingResult extends ActionResult {
  booking?: Booking;
}

interface CreateResourceResult extends ActionResult {
  resource?: Resource;
}

interface AppContextValue extends AppState {
  isHydrated: boolean;
  isCatalogueLoading: boolean;
  catalogueError: string | null;
  refreshCatalogue: () => Promise<void>;
  currentUser: User;
  adminUser: User;
  createBooking: (input: CreateBookingInput) => CreateBookingResult;
  cancelBooking: (bookingId: string) => ActionResult;
  approveBooking: (bookingId: string, notes: string) => ActionResult;
  rejectBooking: (bookingId: string, notes: string) => ActionResult;
  createResource: (input: ResourceInput) => Promise<CreateResourceResult>;
  updateResource: (
    resourceId: string,
    input: ResourceInput,
  ) => Promise<ActionResult>;
  deleteResource: (resourceId: string) => Promise<ActionResult>;
  createCategory: (input: CategoryInput) => Promise<ActionResult>;
  updateCategory: (
    categoryId: string,
    input: CategoryInput,
  ) => Promise<ActionResult>;
  deleteCategory: (categoryId: string) => Promise<ActionResult>;
  issueBooking: (bookingId: string, input: IssueInput) => ActionResult;
  recordReturn: (returnRecordId: string, input: ReturnInput) => ActionResult;
  updateUser: (
    userId: string,
    values: ProfileFormValues,
  ) => Promise<ActionResult>;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  resetDemoData: () => void;
}

const UNKNOWN_USER: User = {
  id: "usr-unknown",
  name: "Unknown user",
  email: "",
  avatar: "",
  role: "student",
  department: "",
  phone: "",
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user: authUser, updateProfile } = useAuth();
  const [state, dispatch] = useReducer(appReducer, undefined, createInitialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCatalogueLoading, setIsCatalogueLoading] = useState(true);
  const [catalogueError, setCatalogueError] = useState<string | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const loadCatalogue = useCallback(async () => {
    setIsCatalogueLoading(true);
    setCatalogueError(null);

    try {
      const [categories, resources] = await Promise.all([
        listCategories(),
        listResources(),
      ]);
      dispatch({ type: "hydrate-catalogue", categories, resources });
    } catch (error) {
      setCatalogueError(
        getApiErrorMessage(error, "Unable to load the catalogue."),
      );
    } finally {
      setIsCatalogueLoading(false);
    }
  }, []);

  useEffect(() => {
    // The catalogue is external server state; loading it on mount is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCatalogue();
  }, [loadCatalogue]);

  useEffect(() => {
    if (!authUser) return;
    dispatch({ type: "upsert-user", user: toAppUser(authUser) });
  }, [authUser]);

  useEffect(() => {
    const stored = loadAppState();
    if (stored) {
      dispatch({ type: "hydrate-local", state: stored });
    }
    // Hydration is intentionally a post-mount step so server and first client
    // renders match before persisted data is applied.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    saveAppState(state);
  }, [state, isHydrated]);

  const createBooking = useCallback(
    (input: CreateBookingInput): CreateBookingResult => {
      const current = stateRef.current;
      const resource = current.resources.find(
        (item) => item.id === input.resourceId,
      );
      if (!resource) {
        return { success: false, message: "That resource could not be found." };
      }

      if (!validateBookingWindow(input)) {
        return {
          success: false,
          message: "Choose a valid date and time range for your booking.",
        };
      }

      if (
        new Date(`${input.startDate}T${input.startTime}:00`) < new Date()
      ) {
        return {
          success: false,
          message: "Choose a start date and time in the future.",
        };
      }

      const preview = getAvailabilityPreview(
        resource,
        current.bookings,
        input,
        input.quantity,
      );

      if (!preview.isBookable) {
        return {
          success: false,
          message: `${resource.name} is not currently available for booking.`,
        };
      }

      if (!preview.isEnough) {
        return {
          success: false,
          message: `Only ${preview.projectedAvailable} unit${preview.projectedAvailable === 1 ? "" : "s"} can be reserved for that time range.`,
        };
      }

      const booking: Booking = {
        id: generateId("bkg"),
        bookingReference: generateBookingReference(current.bookings),
        userId: input.userId,
        resourceId: input.resourceId,
        purpose: input.purpose.trim(),
        startDate: input.startDate,
        endDate: input.endDate,
        startTime: input.startTime,
        endTime: input.endTime,
        quantity: input.quantity,
        status: "pending",
        notes: input.notes?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: "create-booking", booking });
      return {
        success: true,
        message: `Booking ${booking.bookingReference} submitted for approval.`,
        booking,
      };
    },
    [],
  );

  const cancelBooking = useCallback((bookingId: string): ActionResult => {
    const current = stateRef.current;
    const booking = current.bookings.find((item) => item.id === bookingId);
    if (!booking) {
      return { success: false, message: "Booking not found." };
    }

    const returnRecord = getReturnForBooking(current.returns, bookingId);
    const eligibility = getCancelEligibility(booking, returnRecord);
    if (!eligibility.allowed) {
      return {
        success: false,
        message: eligibility.reason ?? "This booking cannot be cancelled.",
      };
    }

    dispatch({
      type: "cancel-booking",
      bookingId,
      decisionAt: new Date().toISOString(),
    });
    return {
      success: true,
      message: `Booking ${booking.bookingReference} was cancelled.`,
    };
  }, []);

  const approveBooking = useCallback(
    (bookingId: string, notes: string): ActionResult => {
      const current = stateRef.current;
      const booking = current.bookings.find((item) => item.id === bookingId);
      if (!booking) {
        return { success: false, message: "Booking not found." };
      }
      if (booking.status !== "pending") {
        return {
          success: false,
          message: "Only pending requests can be approved.",
        };
      }

      const resource = current.resources.find(
        (item) => item.id === booking.resourceId,
      );
      if (!resource) {
        return { success: false, message: "Resource not found." };
      }
      if (resource.availableQuantity < booking.quantity) {
        return {
          success: false,
          message: `Only ${resource.availableQuantity} unit${resource.availableQuantity === 1 ? "" : "s"} are available. Adjust inventory or reject the request.`,
        };
      }

      dispatch({
        type: "approve-booking",
        bookingId,
        notes: notes.trim(),
        decisionAt: new Date().toISOString(),
      });
      return {
        success: true,
        message: `${booking.bookingReference} approved.`,
      };
    },
    [],
  );

  const rejectBooking = useCallback(
    (bookingId: string, notes: string): ActionResult => {
      const current = stateRef.current;
      const booking = current.bookings.find((item) => item.id === bookingId);
      if (!booking) {
        return { success: false, message: "Booking not found." };
      }
      if (booking.status !== "pending") {
        return {
          success: false,
          message: "Only pending requests can be rejected.",
        };
      }

      dispatch({
        type: "reject-booking",
        bookingId,
        notes: notes.trim(),
        decisionAt: new Date().toISOString(),
      });
      return {
        success: true,
        message: `${booking.bookingReference} rejected.`,
      };
    },
    [],
  );

  const createResource = useCallback(
    async (input: ResourceInput): Promise<CreateResourceResult> => {
      try {
        const resource = await createResourceRequest(input);
        dispatch({ type: "create-resource", resource });
        return {
          success: true,
          message: `${resource.name} added to the inventory.`,
          resource,
        };
      } catch (error) {
        return {
          success: false,
          message: getApiErrorMessage(error, "Unable to add the resource."),
        };
      }
    },
    [],
  );

  const updateResource = useCallback(
    async (
      resourceId: string,
      input: ResourceInput,
    ): Promise<ActionResult> => {
      const existing = stateRef.current.resources.find(
        (item) => item.id === resourceId,
      );
      if (!existing) {
        return { success: false, message: "Resource not found." };
      }

      try {
        const resource = await updateResourceRequest(resourceId, input);
        dispatch({ type: "update-resource", resource });
        return {
          success: true,
          message: `${resource.name} updated.`,
        };
      } catch (error) {
        return {
          success: false,
          message: getApiErrorMessage(
            error,
            "Unable to update the resource.",
          ),
        };
      }
    },
    [],
  );

  const deleteResource = useCallback(
    async (resourceId: string): Promise<ActionResult> => {
      const current = stateRef.current;
      const resource = current.resources.find(
        (item) => item.id === resourceId,
      );
      if (!resource) {
        return { success: false, message: "Resource not found." };
      }

      const hasActiveBookings = current.bookings.some(
        (booking) =>
          booking.resourceId === resourceId &&
          (booking.status === "pending" || booking.status === "approved"),
      );
      if (hasActiveBookings) {
        return {
          success: false,
          message:
            "Resolve pending or approved bookings before deleting this resource.",
        };
      }

      try {
        await deleteResourceRequest(resourceId);
        dispatch({ type: "delete-resource", resourceId });
        return { success: true, message: `${resource.name} removed.` };
      } catch (error) {
        return {
          success: false,
          message: getApiErrorMessage(
            error,
            "Unable to delete the resource.",
          ),
        };
      }
    },
    [],
  );

  const createCategory = useCallback(
    async (input: CategoryInput): Promise<ActionResult> => {
      try {
        const category = await createCategoryRequest(input);
        dispatch({ type: "create-category", category });
        return { success: true, message: `${category.name} added.` };
      } catch (error) {
        return {
          success: false,
          message: getApiErrorMessage(error, "Unable to add the category."),
        };
      }
    },
    [],
  );

  const updateCategory = useCallback(
    async (
      categoryId: string,
      input: CategoryInput,
    ): Promise<ActionResult> => {
      try {
        const category = await updateCategoryRequest(categoryId, input);
        dispatch({ type: "update-category", category });
        return { success: true, message: `${category.name} updated.` };
      } catch (error) {
        return {
          success: false,
          message: getApiErrorMessage(
            error,
            "Unable to update the category.",
          ),
        };
      }
    },
    [],
  );

  const deleteCategory = useCallback(
    async (categoryId: string): Promise<ActionResult> => {
      const current = stateRef.current;
      const category = current.categories.find(
        (item) => item.id === categoryId,
      );
      if (!category) {
        return { success: false, message: "Category not found." };
      }

      if (
        current.resources.some(
          (resource) => resource.categoryId === categoryId,
        )
      ) {
        return {
          success: false,
          message:
            "Move or delete the resources in this category before removing it.",
        };
      }

      try {
        await deleteCategoryRequest(categoryId);
        dispatch({ type: "delete-category", categoryId });
        return { success: true, message: `${category.name} removed.` };
      } catch (error) {
        return {
          success: false,
          message: getApiErrorMessage(
            error,
            "Unable to delete the category.",
          ),
        };
      }
    },
    [],
  );

  const issueBooking = useCallback(
    (bookingId: string, input: IssueInput): ActionResult => {
      const current = stateRef.current;
      const booking = current.bookings.find((item) => item.id === bookingId);
      if (!booking) {
        return { success: false, message: "Booking not found." };
      }
      if (booking.status !== "approved") {
        return {
          success: false,
          message: "Only approved bookings can be issued.",
        };
      }

      const existing = getReturnForBooking(current.returns, bookingId);
      if (existing && existing.status !== "ready") {
        return {
          success: false,
          message: "This booking has already been issued.",
        };
      }

      if (
        input.issuedQuantity < 1 ||
        input.issuedQuantity > booking.quantity
      ) {
        return {
          success: false,
          message: `Issue between 1 and ${booking.quantity} unit${booking.quantity === 1 ? "" : "s"}.`,
        };
      }

      const returnRecord = {
        id: existing?.id ?? generateId("ret"),
        bookingId,
        issueDate: input.issueDate,
        expectedReturnDate: existing?.expectedReturnDate ?? booking.endDate,
        actualReturnDate: null,
        issuedQuantity: input.issuedQuantity,
        returnedQuantity: 0,
        condition: null,
        notes: "",
        issueNotes: input.notes.trim(),
        status: "issued" as const,
      };

      dispatch({ type: "issue-booking", returnRecord });
      return {
        success: true,
        message: `${booking.bookingReference} marked as issued.`,
      };
    },
    [],
  );

  const recordReturn = useCallback(
    (returnRecordId: string, input: ReturnInput): ActionResult => {
      const current = stateRef.current;
      const record = current.returns.find(
        (item) => item.id === returnRecordId,
      );
      if (!record) {
        return { success: false, message: "Return record not found." };
      }
      if (record.status !== "issued") {
        return {
          success: false,
          message: "This equipment is not currently issued.",
        };
      }

      const remaining = record.issuedQuantity - record.returnedQuantity;
      if (input.returnedQuantity < 1 || input.returnedQuantity > remaining) {
        return {
          success: false,
          message: `Return between 1 and ${remaining} unit${remaining === 1 ? "" : "s"}.`,
        };
      }

      dispatch({
        type: "record-return",
        returnRecordId,
        actualReturnDate: input.actualReturnDate,
        returnedQuantity: input.returnedQuantity,
        condition: input.condition,
        notes: input.notes.trim(),
      });
      return {
        success: true,
        message: "Return recorded and inventory availability updated.",
      };
    },
    [],
  );

  const updateUser = useCallback(
    async (
      userId: string,
      values: ProfileFormValues,
    ): Promise<ActionResult> => {
      if (!authUser || authUser.id !== userId) {
        return {
          success: false,
          message: "You can only update your own profile.",
        };
      }

      try {
        const updated = await updateProfile({
          name: values.name.trim(),
          department: values.department.trim(),
          phone: values.phone.trim(),
        });
        dispatch({ type: "upsert-user", user: toAppUser(updated) });
        return { success: true, message: "Profile updated." };
      } catch (error) {
        return {
          success: false,
          message: getApiErrorMessage(
            error,
            "Unable to update your profile.",
          ),
        };
      }
    },
    [authUser, updateProfile],
  );

  const updatePreferences = useCallback(
    (preferences: Partial<UserPreferences>) => {
      dispatch({ type: "update-preferences", preferences });
    },
    [],
  );

  const resetDemoData = useCallback(() => {
    clearAppState();
    const current = stateRef.current;
    const next = createInitialState();
    const users = authUser
      ? [
          ...next.users.filter((user) => user.id !== authUser.id),
          toAppUser(authUser),
        ]
      : next.users;

    dispatch({
      type: "hydrate",
      state: {
        ...next,
        resources: current.resources,
        categories: current.categories,
        users,
      },
    });
    void loadCatalogue();
  }, [authUser, loadCatalogue]);

  const authAppUser = useMemo(
    () => (authUser ? toAppUser(authUser) : null),
    [authUser],
  );
  const currentUser = authAppUser ?? UNKNOWN_USER;
  const adminUser = authAppUser ?? UNKNOWN_USER;

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      isHydrated,
      isCatalogueLoading,
      catalogueError,
      refreshCatalogue: loadCatalogue,
      currentUser,
      adminUser,
      createBooking,
      cancelBooking,
      approveBooking,
      rejectBooking,
      createResource,
      updateResource,
      deleteResource,
      createCategory,
      updateCategory,
      deleteCategory,
      issueBooking,
      recordReturn,
      updateUser,
      updatePreferences,
      resetDemoData,
    }),
    [
      state,
      isHydrated,
      isCatalogueLoading,
      catalogueError,
      loadCatalogue,
      currentUser,
      adminUser,
      createBooking,
      cancelBooking,
      approveBooking,
      rejectBooking,
      createResource,
      updateResource,
      deleteResource,
      createCategory,
      updateCategory,
      deleteCategory,
      issueBooking,
      recordReturn,
      updateUser,
      updatePreferences,
      resetDemoData,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider.");
  }
  return context;
}

export function useTodayLabel(): string {
  return format(new Date(), "EEEE, MMMM d");
}
