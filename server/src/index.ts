import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import ApiServer from "./api";
import * as Sentry from "@sentry/node";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as Tracing from "@sentry/tracing";

Sentry.init({
  dsn:
    "https://f74dafc67c914776b018c3be136bca19@o434108.ingest.sentry.io/5411826",
  // send 10% of all errors to Sentry
  tracesSampleRate: 0.1,
});

const app = express();

// Redirect to https on Heroku
if (
  process.env.NODE_ENV === "production" &&
  process.env.FORCE_HTTPS !== undefined
) {
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https") {
      res.redirect(`https://${req.header("host")}${req.url}`);
    } else {
      next();
    }
  });
}

const rootPath = path.join(__dirname, "..", "..");
const staticPath = path.join(rootPath, "client", "build");
console.log(`Serving static files from: ${staticPath}`);
app.use("/", express.static(staticPath));
app.get("/*", (req, res) => {
  res.sendFile(path.join(staticPath, "/index.html"));
});

const httpServer = http.createServer(app);
const port = process.env.PORT || 8080;
httpServer.listen(port);
console.log(`Server listening on port: ${port}`);

if (!process.env.DISABLE_API) {
  app.use(cors());
  app.use(express.json());
  ApiServer.start(app, httpServer);
}
