// Load environment variables first (before any other imports that use process.env)
import dotenv from "dotenv";
dotenv.config(); // .env
dotenv.config({ path: ".env.local" }); // .env.local overrides (e.g. for DATABASE_URL)

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { initializeEmailTransporter } from "./email";
import { validateEnvironment, printEnvironmentValidation } from "./env-validation";
import { errorHandler, notFoundHandler, setupUnhandledRejectionHandler } from "./error-handling";


export const app = express();
export const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "1mb", // Explicit body size limit
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "1mb" }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Log request method/path/status/duration only — never log response bodies (PII risk)
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

export async function startServer() {
  // Setup global error handlers first
  setupUnhandledRejectionHandler();

  // Validate environment variables first
  console.log("🔍 Validating environment variables...");
  const envValidation = validateEnvironment();
  printEnvironmentValidation(envValidation);

  // Initialize email transporter for password reset
  initializeEmailTransporter();
  
  await registerRoutes(httpServer, app);

  // 404 handler (must be before error handler)
  app.use(notFoundHandler);

  // Centralized error handling middleware (must be last)
  app.use(errorHandler);

  // only setup vite when running in development (not in production or tests)
  // this ensures the test suite doesn't spawn a file-watching dev server that
  // can restart the app unexpectedly during automated runs.
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else if (process.env.NODE_ENV === "development") {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // Avoid binding to actual network in test environment to prevent socket errors
  if (process.env.NODE_ENV !== "test") {
    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || "5000", 10);
    httpServer.listen(
      {
        port,
        host: "0.0.0.0",
        reusePort: true,
      },
      () => {
        log(`serving on port ${port}`);
      },
    );
  } else {
    console.log("Skipping network listener in test mode");
  }
}

// Only start the server if not in test environment
if (process.env.NODE_ENV !== "test") {
  startServer();
}
