import { z } from "zod";

// ── Notify Email Schema ───────────────────────────────────────────────────────
export const notifyEmailSchema = z.object({
  customerId: z.string().min(1),
  customerEmail: z.string().email(),
  templateSlug: z.string().min(1),
  data: z.record(z.string(), z.any()).optional(),
  to: z.array(z.string().email()).optional(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  replyTo: z.string().email().optional(),
  files: z.any().optional(),
  filePaths: z.array(z.string()).optional(),
  uploadedPaths: z
    .array(
      z.object({
        path: z.string(),
        originalname: z.string(),
      }),
    )
    .optional(),
});

// ── Notify Push Schema ────────────────────────────────────────────────────────
export const notifyPushSchema = z.object({
  customerId: z.string().min(1),
  customerEmail: z.string().email(),
  templateSlug: z.string().min(1),
  data: z.record(z.string(), z.any()).optional(),
});

// ── Test Email Schema ─────────────────────────────────────────────────────────
export const testEmailSchema = z.object({
  templateSlug: z.string().min(1),
  data: z.record(z.string(), z.any()).optional(),
  to: z.array(z.string().email()).optional(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  replyTo: z.string().email().optional(),
});

// ── Test Push Schema ──────────────────────────────────────────────────────────
export const testPushSchema = z.object({
  templateSlug: z.string().min(1),
  data: z.record(z.string(), z.any()).optional(),
});
