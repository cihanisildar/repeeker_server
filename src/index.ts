import "module-alias/register";
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { errorMiddleware } from "./middlewares/error.middleware";
import { generalRateLimit } from "./middlewares/rate-limit.middleware";
import { logger } from "./utils/logger";
import routes from "./routes";

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Middlewares
app.use(helmet());
app.use(generalRateLimit);
app.use(
  cors({
    origin: (() => {
      const defaultOrigins = [
        "https://www.repeeker.com",
        "https://api.repeeker.com",
        "http://localhost:3000", 
        "http://localhost:3001", 
      ];
      
      if (process.env.CORS_ORIGIN) {
        const envOrigins = process.env.CORS_ORIGIN.split(',');
        // In development, always include localhost origins
        if (process.env.NODE_ENV === 'development') {
          const devOrigins = ["http://localhost:3000", "http://localhost:3001"];
          return [...new Set([...envOrigins, ...devOrigins])];
        }
        return envOrigins;
      }
      
      return defaultOrigins;
    })(),
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

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Repeeker API Documentation",
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Repeeker Server is running",
    timestamp: new Date().toISOString(),
    port: port,
    documentation: "/api-docs",
    apiEndpoint: "/api",
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

app.listen(port, "0.0.0.0", () => {
  console.log(`=== SERVER STARTED ===`);
  console.log(`Port: ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS Origin: ${process.env.CORS_ORIGIN || 'default origins'}`);
  console.log(`Features: OpenAI=${!!process.env.OPENAI_API_KEY}, Redis=${!!process.env.REDIS_URL}`);
  console.log(`Listening on 0.0.0.0:${port}`);
  console.log(`=== API DOCUMENTATION ===`);
  console.log(`Swagger UI: http://localhost:${port}/api-docs`);
  console.log(`========================`);
  logger.info(`Server is running on port ${port}`);
  logger.info(`API Documentation available at http://localhost:${port}/api-docs`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
