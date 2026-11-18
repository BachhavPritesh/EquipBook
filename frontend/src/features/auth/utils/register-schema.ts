import { z } from "zod";

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Enter your full name.")
      .max(80, "Keep your name under 80 characters."),
    email: z.email("Enter a valid email address."),
    role: z.enum(["student", "employee", "faculty"]),
    department: z
      .string()
      .trim()
      .max(100, "Keep the department under 100 characters."),
    phone: z
      .string()
      .trim()
      .max(30, "Keep the phone number under 30 characters."),
    password: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterFormSchema = z.infer<typeof registerSchema>;
