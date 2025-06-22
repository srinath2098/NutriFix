import express, { type Express } from "express";
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createLogger, format, transports } from 'winston';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app with proper typing
export const expressApp: Express = express();

// Initialize server configuration
export const isProduction = process.env.NODE_ENV === 'production';
export const port = process.env.PORT || 3000;

// Initialize logger
export const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'nutritracker-api' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple(),
        format.printf(({ level, message, timestamp, ...metadata }) => {
          let msg = `${timestamp} [${level}] : ${message}`;
          if (Object.keys(metadata).length > 0) {
            msg += JSON.stringify(metadata, null, 2);
          }
          return msg;
        })
      )
    })
  ]
});

// Initialize server
export const server = createServer(expressApp);
export const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.CLIENT_URL 
      : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5050'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/socket.io'
});

// Initialize WebSocket connection handling
io.on('connection', (socket) => {
  logger.info('WebSocket client connected', { id: socket.id });
  
  socket.on('disconnect', () => {
    logger.info('WebSocket client disconnected', { id: socket.id });
  });
});
