"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const error_middleware_1 = require("./middlewares/error.middleware");
const logger_1 = require("./utils/logger");
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
const port = process.env.PORT || 8080;
// Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        console.log('=== CORS DEBUG ===');
        console.log('Request origin:', origin);
        console.log('CORS_ORIGIN env var:', process.env.CORS_ORIGIN);
        console.log('Allowed origins:', process.env.CORS_ORIGIN || 'http://localhost:3000');
        const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
        // Allow requests with no origin (mobile apps, curl, Postman, etc.)
        if (!origin) {
            console.log('No origin - allowing');
            return callback(null, true);
        }
        if (origin === allowedOrigin) {
            console.log('Origin matches - allowing');
            return callback(null, true);
        }
        console.log('Origin does not match - blocking');
        callback(new Error(`CORS policy violation. Origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
// Routes
app.use('/api', routes_1.default);
// Error handling
app.use(error_middleware_1.errorMiddleware);
// Start server
app.listen(port, () => {
    logger_1.logger.info(`Server is running on port ${port}`);
});
