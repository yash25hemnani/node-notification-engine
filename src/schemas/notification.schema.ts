import { z } from "zod";

export const notifySchema = z.object({
  channel: z.enum(["email", "push"]),
  recipient: z.string().min(1),
  templateSlug: z.string().min(1),
  data: z.record(z.string(), z.any()),
});