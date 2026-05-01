import { z } from "zod";

export const notifySchema = z.object({
  channel: z.enum(["email", "push"]),
  customerId: z.string().min(1),
  customerEmail: z.string().min(1),
  templateSlug: z.string().min(1),
  data: z.record(z.string(), z.any()).optional(),
});
