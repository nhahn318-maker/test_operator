import { z } from "zod";

export const emailSchema = z.email("Must be a valid email address.").transform((value) => value.trim().toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "Must be at least 8 characters.")
  .max(200, "Must be 200 characters or fewer.");

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Must be at least 1 character.")
  .max(100, "Must be 100 characters or fewer.");

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema.optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const todoStatusSchema = z.enum(["active", "completed"]);

export const isoDateSchema = z.string().datetime({ offset: true, message: "Must be a valid ISO 8601 timestamp." });

export const createTodoSchema = z.object({
  title: z.string().trim().min(1, "Must be at least 1 character.").max(200, "Must be 200 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(2000, "Must be 2000 characters or fewer.")
    .optional(),
  dueDate: isoDateSchema.nullable().optional(),
  status: todoStatusSchema.optional(),
});

export const updateTodoSchema = z
  .object({
    title: z.string().trim().min(1, "Must be at least 1 character.").max(200, "Must be 200 characters or fewer.").optional(),
    description: z.string().trim().max(2000, "Must be 2000 characters or fewer.").nullable().optional(),
    dueDate: isoDateSchema.nullable().optional(),
    status: todoStatusSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required.",
    path: ["body"],
  });

export const listTodosQuerySchema = z.object({
  status: todoStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  sort: z.enum(["createdAt_desc", "updatedAt_desc", "dueDate_asc"]).default("updatedAt_desc"),
});

export const dashboardQuerySchema = z.object({
  priorityLimit: z.coerce.number().int().min(1).max(10).default(5),
});
