import "dotenv/config";
import express from "express";
import { modelsRouter } from "./routes/models.js";
import { directivesRouter } from "./routes/directives.js";

/** Shared API app mounted both by Vite's dev middleware (vite.config.ts) and
 * the production Express server (server/index.ts), so route/body-parsing
 * setup lives in exactly one place. */
export const apiApp = express();
apiApp.use(express.json());
apiApp.use("/models", modelsRouter);
apiApp.use("/directives", directivesRouter);
