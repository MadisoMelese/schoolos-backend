import dns from 'node:dns/promises';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import express from "express";
import type { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import env from "./config/env.js";

const app: Application = express();

// ─── Global Middlewares ───────────────────────────────────────────────────────

// Configure helmet with comprehensive security headers
app.use(
  helmet({
    // Content-Security-Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", env.clientUrl],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    // HTTP Strict Transport Security (HSTS)
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    // Cross-Origin-Opener-Policy
    crossOriginOpenerPolicy: {
      policy: "same-origin",
    },
    // X-Frame-Options
    frameguard: {
      action: "deny",
    },
    // Additional security headers
    xssFilter: true,
    noSniff: true,
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },
  })
);

const corsOptions: cors.CorsOptions = {
  origin: (requestOrigin: string | undefined, callback: (err: Error | null, origin?: boolean) => void) => {
    if (!requestOrigin) return callback(null, true); // allow Postman, curl, server-to-server

    // Support multiple allowed origins (comma-separated in CLIENT_URL)
    const allowedOrigins = env.clientUrl
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    // Also allow any Vercel preview deployment for the same project
    const isVercelPreview = /^https:\/\/[a-z0-9-]+-[a-z0-9]+-[a-z0-9]+\.vercel\.app$/.test(requestOrigin);

    if (allowedOrigins.includes(requestOrigin) || isVercelPreview) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.nodeEnv === "development") {
  app.use(morgan("dev"));
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/api", routes);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "AuthForge Express API is running",
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use(errorMiddleware);

export default app;