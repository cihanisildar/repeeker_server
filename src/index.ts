import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorMiddleware } from './middlewares/error.middleware';
import { logger } from './utils/logger';
import routes from './routes';

const app = express();
const port = process.env.PORT || 8080;

// Middlewares
app.use(helmet());
app.use(cors({
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
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api', routes);

// Error handling
app.use(errorMiddleware);

// Start server
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
}); 