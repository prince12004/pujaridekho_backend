import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env, isProduction } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { notFoundHandler } from "./middlewares/not-found.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { LOCAL_UPLOAD_DIR } from "./lib/cloud-storage.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: isProduction
        ? env.CLIENT_URL
        : (origin, callback) => callback(null, !origin || /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)),
      credentials: true,
    }),
  );
  // 12mb: default 100kb is too small once the CRM's activity-log voice
  // notes (base64 audio, capped client-side at ~2 minutes — see
  // crm-activity-log.model.ts) start posting through POST
  // /crm-activity-logs. Ported limit from pujaridekhocrm/backend/server.js.
  app.use(express.json({ limit: "12mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(isProduction ? "combined" : "dev"));

  app.use(
    "/uploads",
    (req, res, next) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      next();
    },
    express.static(LOCAL_UPLOAD_DIR),
  );
  app.use(`/api/${env.API_VERSION}`, apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
