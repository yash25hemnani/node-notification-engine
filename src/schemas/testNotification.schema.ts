import { z } from "zod";

export const testNotificationSchema = z.object({
  channel: z.enum(["email", "push"]),
  templateSlug: z.string().min(1),
  data: z.record(z.string(), z.any()),
});