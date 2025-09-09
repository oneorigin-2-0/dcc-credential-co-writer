/**
 * Zod validation schemas
 * Centralized validation logic for forms and API requests
 */

import { z } from "zod";

// Badge form validation schema
export const badgeFormSchema = z.object({
  content: z
    .string()
    .min(50, { message: "Please provide at least 50 characters for analysis." })
    .max(5000, { message: "Content must be less than 5000 characters." }),
  title: z
    .string()
    .min(1, { message: "Title is required." })
    .max(100, { message: "Title must be less than 100 characters." }),
  description: z
    .string()
    .min(1, { message: "Description is required." })
    .max(500, { message: "Description must be less than 500 characters." }),
  criteria: z
    .string()
    .min(1, { message: "Criteria is required." })
    .max(1000, { message: "Criteria must be less than 1000 characters." }),
  image: z.string().url().optional().or(z.literal("")),
});

export type BadgeFormValues = z.infer<typeof badgeFormSchema>;

// API request validation schema
export const generateSuggestionsSchema = z.object({
  content: z.string().min(50, "Content must be at least 50 characters long"),
});

export type GenerateSuggestionsInput = z.infer<
  typeof generateSuggestionsSchema
>;
