import { Router } from "express";
import authRouter from "../modules/auth/auth.routes.js";
import usersRouter from "../modules/users/users.routes.js";
import activityLogsRouter from "../modules/activityLogs/activityLogs.routes.js";
import aiRouter from "../modules/ai/ai.routes.js";
import { isDbConnected } from "../config/db.js";

const router = Router();

router.get("/health", (_req, res) =>
  res.json({
    success: true,
    message: "Server ishlayapti",
    mode: isDbConnected() ? "mongodb" : "mock",
  }),
);

router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/activity-logs", activityLogsRouter);
router.use("/ai", aiRouter);

export default router;
