import z from "zod";

export const patchTemplateSchema = z
  .object({
    subject: z.string().min(1, "Subject is required").optional(),
    body: z.string().min(1, "Body is required").optional(),
  })
  .refine((data) => data.subject || data.body, {
    message: "Either subject or body is required",
  });
