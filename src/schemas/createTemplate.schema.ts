import { z } from "zod";

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  channel: z.enum(["email", "sms", "whatsapp", "push"], {
    error: "Channel is required",
  }),
});