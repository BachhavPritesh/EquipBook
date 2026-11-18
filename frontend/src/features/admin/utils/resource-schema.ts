import { z } from "zod";

export const resourceSchema = z
  .object({
    name: z
      .string()
      .min(2, "Enter a resource name.")
      .max(80, "Keep the name under 80 characters."),
    categoryId: z.string().min(1, "Choose a category."),
    description: z
      .string()
      .min(20, "Describe the resource in at least 20 characters.")
      .max(600, "Keep the description under 600 characters."),
    location: z
      .string()
      .min(2, "Enter a collection location.")
      .max(100, "Keep the location under 100 characters."),
    image: z.url("Enter a valid image URL."),
    totalQuantity: z
      .number({ error: "Enter the total quantity." })
      .int("Use a whole number.")
      .min(1, "At least one unit is required.")
      .max(500, "Keep quantities under 500."),
    availableQuantity: z
      .number({ error: "Enter the available quantity." })
      .int("Use a whole number.")
      .min(0, "Availability cannot be negative.")
      .max(500, "Keep quantities under 500."),
    status: z.enum(["available", "unavailable", "maintenance"]),
    instructions: z
      .string()
      .min(10, "Add short usage instructions.")
      .max(600, "Keep instructions under 600 characters."),
    requirements: z
      .string()
      .min(5, "Add at least one booking requirement.")
      .max(600, "Keep requirements under 600 characters."),
  })
  .refine((values) => values.availableQuantity <= values.totalQuantity, {
    message: "Available units cannot exceed the total.",
    path: ["availableQuantity"],
  });

export type ResourceFormSchema = z.infer<typeof resourceSchema>;
