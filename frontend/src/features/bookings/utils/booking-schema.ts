import { z } from "zod";

export const bookingRequestSchema = z
  .object({
    resourceId: z.string().min(1, "Choose a resource to book."),
    purpose: z
      .string()
      .min(10, "Describe the purpose in at least 10 characters.")
      .max(240, "Keep the purpose under 240 characters."),
    startDate: z.string().min(1, "Choose a start date."),
    endDate: z.string().min(1, "Choose an end date."),
    startTime: z.string().min(1, "Choose a start time."),
    endTime: z.string().min(1, "Choose an end time."),
    quantity: z
      .number({ error: "Enter a quantity." })
      .int("Use a whole number.")
      .min(1, "Request at least one unit.")
      .max(50, "For larger requests, contact the resource desk."),
    notes: z
      .string()
      .max(500, "Keep additional notes under 500 characters.")
      .optional(),
  })
  .refine((values) => values.endDate >= values.startDate, {
    message: "The end date cannot be before the start date.",
    path: ["endDate"],
  })
  .refine(
    (values) =>
      new Date(
        `${values.endDate}T${values.endTime}:00`,
      ).getTime() > new Date(`${values.startDate}T${values.startTime}:00`).getTime(),
    {
      message: "The end date and time must be after the start.",
      path: ["endTime"],
    },
  );

export type BookingFormValues = z.infer<typeof bookingRequestSchema>;
