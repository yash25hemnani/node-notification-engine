import express from "express";
import cors from "cors";
import helmet from "helmet";
import notificationRoutes from "./routes/notification.routes";
import subscriptionRoutes from "./routes/subscription.routes";
import authRoutes from "./routes/auth.routes";
import templateRoutes from "./routes/templates.routes"
import keysRoutes from "./routes/keys.routes";
import cookieParser from "cookie-parser";
import listRoutes from "express-list-routes";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";


/**
 * Express Setup
 */ 
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true, 
  })
);
app.use(helmet());
app.use(cookieParser());

// health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Notification routes
app.use("/api/notification", notificationRoutes);
app.use("/api/subscripition", subscriptionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/keys", keysRoutes);
app.use("/api/templates", templateRoutes);   

export default app;
