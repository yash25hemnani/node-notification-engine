import { z } from "zod";

export const notifySchema = z.object({
  channel: z.enum(["email", "push"]),
  user_id: z.string().min(1),
  user_email: z.string().min(1),
  templateSlug: z.string().min(1),
  data: z.record(z.string(), z.any()),
});