import "module-alias/register";
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorMiddleware } from "./middlewares/error.middleware";
import { logger } from "./utils/logger";
import routes from "./routes";

const app = express();
// Railway assigns the port dynamically - MUST use this
const port = parseInt(process.env.PORT || "8080", 10);

// Middlewares
app.use(helmet());
app.use(
  cors({
    origin: [
      "https://www.repeeker.com",
      "repeekerserver-production.up.railway.app", 
      "https://www.repeeker.com/", // Add your specific Vercel deployment URL
      "http://localhost:3000", // For local development
      "http://localhost:3001", // Backup local port
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

app.use(express.json());
app.use(morgan("dev"));

// CRITICAL: Add health check endpoint that Railway expects
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Repeeker Server is running",
    timestamp: new Date().toISOString(),
    port: port,
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.get("/test", (req, res) => {
  console.log("=== TEST ENDPOINT HIT ===");
  res.json({
    message: "Server is working",
    timestamp: new Date().toISOString(),
    origin: req.headers.origin,
    cors_origin: process.env.CORS_ORIGIN,
  });
});

// Routes
app.use("/api", routes);

// Error handling
app.use(errorMiddleware);

// CRITICAL: Must bind to 0.0.0.0 for Railway, not localhost
app.listen(port, "0.0.0.0", () => {
  console.log(`=== SERVER STARTED ===`);
  console.log(`Port: ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`CORS Origin: ${process.env.CORS_ORIGIN}`);
  console.log(`Listening on 0.0.0.0:${port}`);
  logger.info(`Server is running on port ${port}`);
});
