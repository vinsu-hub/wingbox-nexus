import "dotenv/config";
import express from "express";
import { modelsRouter } from "./routes/models.js";
import { directivesRouter } from "./routes/directives.js";
import { qcRouter } from "./routes/qcChecklists.js";
import { lifeTrackingRouter } from "./routes/lifeTracking.js";
import { deliveryRouter } from "./routes/delivery.js";
import { authRouter } from "./routes/auth.js";
import { auditEventsRouter } from "./routes/auditEvents.js";
import { usersRouter } from "./routes/users.js";
import { settingsRouter } from "./routes/settings.js";
import { actionsRouter } from "./routes/actions.js";
import { reviewItemsRouter } from "./routes/reviewItems.js";
import { requireAuth } from "./lib/auth.js";

/** Shared API app mounted both by Vite's dev middleware (vite.config.ts) and
 * the production Express server (server/index.ts), so route/body-parsing
 * setup lives in exactly one place. */
export const apiApp = express();
apiApp.use(express.json());
// Only /auth/* is reachable without a session; everything mounted after
// requireAuth needs a valid (auto-refreshed) session cookie.
apiApp.use("/auth", authRouter);
apiApp.use(requireAuth);
apiApp.use("/models", modelsRouter);
apiApp.use("/directives", directivesRouter);
apiApp.use("/qc", qcRouter);
apiApp.use("/life-tracking", lifeTrackingRouter);
apiApp.use("/delivery", deliveryRouter);
apiApp.use("/audit-events", auditEventsRouter);
apiApp.use("/users", usersRouter);
apiApp.use("/settings", settingsRouter);
apiApp.use("/actions", actionsRouter);
apiApp.use("/review-items", reviewItemsRouter);
