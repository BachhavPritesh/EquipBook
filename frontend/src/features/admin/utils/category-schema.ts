import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .min(2, "Enter a category name.")
    .max(60, "Keep the name under 60 characters."),
  description: z
    .string()
    .min(10, "Add a short description.")
    .max(300, "Keep the description under 300 characters."),
});

export type CategoryFormSchema = z.infer<typeof categorySchema>;
