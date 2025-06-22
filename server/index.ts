import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { isProduction, logger } from './init';
import { setupAuth } from './replitAuth';
import { registerRoutes } from "./routes";

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const expressApp = express();
const server = createServer(expressApp);
const io = new Server(server);

// Set up middleware in the correct order
// Security first
// Disable CSP for development
expressApp.use(helmet({
  contentSecurityPolicy: false
}));

// Compression
expressApp.use(compression());

// CORS configuration
expressApp.use(cors({
  origin: (origin, callback) => {
    if (!origin || (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost:\d+$/.test(origin)) || (process.env.NODE_ENV === 'production' && origin === process.env.CLIENT_URL)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
expressApp.use(express.json());
expressApp.use(express.urlencoded({ extended: true }));

// Rate limiting
expressApp.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

// Set up authentication
setupAuth(expressApp);

// Serve static files
expressApp.use(express.static('dist/public', {
  maxAge: '1d'
}));

// Register API routes
registerRoutes(expressApp);

// Add a catch-all route for React router
expressApp.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info('WebSocket client connected', { id: socket.id });
  
  socket.on('disconnect', () => {
    logger.info('WebSocket client disconnected', { id: socket.id });
  });
});

// Error handling middleware
expressApp.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  let message = 'An unexpected error occurred';
  let stack: string | undefined;
  let status = 500;

  if (err instanceof Error) {
    message = err.message;
    stack = err.stack;
    if ('status' in err && typeof (err as any).status === 'number') {
      status = (err as any).status;
    }
    if ('statusCode' in err && typeof (err as any).statusCode === 'number') {
      status = (err as any).statusCode;
    }
  } else if (typeof err === 'object' && err !== null) {
    if ('message' in err) message = String((err as any).message);
    if ('status' in err) status = Number((err as any).status);
    if ('statusCode' in err) status = Number((err as any).statusCode);
  } else if (typeof err === 'string') {
    message = err;
  }

  logger.error('API Error:', {
    error: message,
    stack: stack,
    path: req.path,
    method: req.method,
    timestamp: new Date(),
    status: status
  });
  
  const responseMessage = isProduction && status === 500 
    ? 'Internal Server Error' 
    : message;
  
  res.status(status).json({
    error: responseMessage,
    stack: isProduction ? undefined : stack,
    code: 'SERVER_ERROR'
  });
});

// Global error handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date()
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', {
    promise,
    reason: (reason instanceof Error) ? reason.message : reason,
    stack: (reason instanceof Error) ? reason.stack : undefined,
    timestamp: new Date()
  });
});

// Start server
const port = process.env.PORT || 5050;
server.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});

