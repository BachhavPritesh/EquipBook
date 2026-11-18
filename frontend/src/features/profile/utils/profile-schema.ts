import { z } from "zod";

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(80, "Keep your name under 80 characters."),
  department: z
    .string()
    .trim()
    .max(100, "Keep the department under 100 characters."),
  phone: z
    .string()
    .trim()
    .max(30, "Keep the phone number under 30 characters."),
});

export type ProfileFormSchema = z.infer<typeof profileSchema>;
