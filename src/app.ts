import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes";
import keysRoutes from "./routes/keys.routes";
import notificationRoutes from "./routes/notification.routes";
import subscriptionRoutes from "./routes/subscription.routes";
import templateRoutes from "./routes/templates.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import fileRoutes from "./routes/files.routes";
import templateAttachmentRoutes from "./routes/templateAttachment.routes";
import miscRoutes from "./routes/misc.routes";
import jobRoutes from "./routes/job.routes";
import adminRoutes from "./routes/admin.routes";

/**
 * Express Setup
 */
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://notification.gxpress.in",
      "https://notification.gxpress.in",
    ],
    credentials: true,
  }),
);
app.use(helmet());
app.use(cookieParser());

// health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Notification routes
app.use("/api/notification", notificationRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/keys", keysRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/attachments/:templateId/", templateAttachmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/jobs", jobRoutes);

app.use("/api/admin", adminRoutes);

app.use("/uploads", express.static("uploads"));
app.use("/open-file", miscRoutes);

export default app;
