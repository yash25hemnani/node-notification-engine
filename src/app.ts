import express from "express";
import cors from "cors";
import helmet from "helmet";
import notificationRoutes from "./routes/notification.routes";


// Express Setup
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());

// health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Notification routes
app.use("/api", notificationRoutes);


export default app;