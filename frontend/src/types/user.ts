export type UserRole = "student" | "employee" | "faculty" | "manager" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  department: string;
  phone: string;
}

export interface UserPreferences {
  bookingUpdates: boolean;
  returnReminders: boolean;
  weeklyDigest: boolean;
  compactTables: boolean;
}

export interface ProfileFormValues {
  name: string;
  department: string;
  phone: string;
}
