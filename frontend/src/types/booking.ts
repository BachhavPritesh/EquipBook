export type BookingStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "completed";

export interface Booking {
  id: string;
  bookingReference: string;
  userId: string;
  resourceId: string;
  purpose: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  quantity: number;
  status: BookingStatus;
  notes?: string;
  adminNotes?: string;
  createdAt: string;
  decisionAt?: string;
}

export interface CreateBookingInput {
  userId: string;
  resourceId: string;
  purpose: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  quantity: number;
  notes?: string;
}

export interface BookingDateRange {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}

export interface BookingDecisionInput {
  notes: string;
}
