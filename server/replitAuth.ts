import { auth, ConfigParams } from "express-openid-connect";
import express, { Request, Response } from "express";
import type { Express } from "express";
import { storage } from "./storage";
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
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

// Validate required environment variables
if (!process.env.AUTH0_DOMAIN || !process.env.AUTH0_CLIENT_ID || !process.env.AUTH0_CLIENT_SECRET) {
  throw new Error('Missing required Auth0 environment variables');
}

// Use server port from environment
const serverPort = process.env.PORT || 5050;

const requiredEnv = [
  'AUTH0_DOMAIN',
  'AUTH0_CLIENT_ID',
  'AUTH0_CLIENT_SECRET',
  'SESSION_SECRET',
];

for (const v of requiredEnv) {
  if (!process.env[v]) {
    console.error(`Missing required environment variable: ${v}`);
    process.exit(1);
  }
}

export const config: ConfigParams = {
  authRequired: false, // Set to false to allow public routes
  auth0Logout: true,
  secret: process.env.SESSION_SECRET as string,
  baseURL: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL 
    : 'http://localhost:5050',
  clientID: process.env.AUTH0_CLIENT_ID as string,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
  clientSecret: process.env.AUTH0_CLIENT_SECRET as string,
  routes: {
    callback: '/api/auth/callback',
    login: '/api/auth/login',
    logout: '/api/auth/logout'
  },
  authorizationParams: {
    response_type: 'code',
    scope: 'openid profile email'
  },
  session: {
    absoluteDuration: 24 * 60 * 60, // 24 hours in seconds
    rolling: true,
    rollingDuration: 60 * 60, // 1 hour in seconds
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/'
    }
  },
  logoutParams: {
    returnTo: process.env.NODE_ENV === 'production' 
      ? (process.env.CLIENT_URL || '') as string
      : '' // Leave empty to allow client to set returnTo dynamically
  }
};

export function setupAuth(app: Express) {
  // Validate required environment variables
  const requiredEnvVars = [
    'AUTH0_DOMAIN',
    'AUTH0_CLIENT_ID',
    'AUTH0_CLIENT_SECRET',
    'SESSION_SECRET'
  ] as const;

  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingEnvVars.length > 0) {
    logger.error('Missing required environment variables:', missingEnvVars);
    process.exit(1);
  }

  // Configure Auth0
  const authConfig: ConfigParams = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    baseURL: process.env.NODE_ENV === 'production' 
      ? process.env.CLIENT_URL || 'https://your-production-url.com'
      : 'http://localhost:5173',
    clientID: process.env.AUTH0_CLIENT_ID || 'dev-client-id',
    issuerBaseURL: process.env.NODE_ENV === 'production' 
      ? `https://${process.env.AUTH0_DOMAIN}` 
      : 'https://dev-auth0-domain.auth0.com',
    clientSecret: process.env.AUTH0_CLIENT_SECRET || 'dev-secret',
    routes: {
      callback: '/api/auth/callback',
      login: '/api/auth/login',
      logout: '/api/auth/logout',
      postLogoutRedirect: '/',
      failure: '/api/auth/failure'
    },
    scope: 'openid profile email',
    session: {
      absoluteDuration: 24 * 60 * 60, // 24 hours in seconds
      rolling: true,
      rollingDuration: 60 * 60, // 1 hour in seconds
      cookie: {
        secure: process.env.NODE_ENV === 'production' && (process.env.CLIENT_URL?.startsWith('https') || false),
      httpOnly: true,
        sameSite: 'Lax',
        domain: process.env.COOKIE_DOMAIN,
        path: '/'
      }
    }
  };

  // Add security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  // Initialize Auth0
  app.use(auth(config));

  // Add user info route
  app.get('/api/user', (req, res) => {
    if (req.oidc.isAuthenticated()) {
      res.json({
        isAuthenticated: true,
        user: req.oidc.user
      });
        } else {
      res.json({
        isAuthenticated: false
      });
    }
  });

  // Add debug route
  app.get('/api/auth/debug', (req, res) => {
    res.json({
      isAuthenticated: req.oidc.isAuthenticated(),
      user: req.oidc.user,
      cookies: req.cookies,
      headers: req.headers
    });
  });

  logger.info('Auth0 configuration initialized');
}

export const isAuthenticated = (req: any, res: express.Response, next: express.NextFunction) => {
  if (req.oidc?.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};
