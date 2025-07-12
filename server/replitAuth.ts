import { auth } from "express-openid-connect";
import express from "express";
import type { Express } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Validate required environment variables
if (!process.env.AUTH0_DOMAIN || !process.env.AUTH0_CLIENT_ID || !process.env.AUTH0_CLIENT_SECRET) {
  throw new Error('Missing required Auth0 environment variables');
}

export const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.SESSION_SECRET!,
  baseURL: process.env.BASE_URL || 'http://localhost:5050',
  clientID: process.env.AUTH0_CLIENT_ID!,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  routes: {
    callback: '/api/callback',
    login: '/api/login',
    logout: '/api/logout'
  },
  authorizationParams: {
    response_type: 'code',
    scope: 'openid profile email'
  }
};

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  const isLocalhost = process.env.REPLIT_DOMAINS?.includes('localhost');
  const isProd = process.env.NODE_ENV === 'production';

  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: true,
    name: '__session',
    proxy: true,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: 'auto',
      sameSite: 'lax',
      path: '/',
      maxAge: sessionTtl
    }
  });
}

export async function setupAuth(app: Express) {
  // Initialize session handling
  app.set("trust proxy", 1);
  
  // Configure session before Auth0
  const sessionMiddleware = getSession();
  app.use((req, res, next) => {
    // Allow credentials in development
    if (process.env.NODE_ENV === 'development') {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    sessionMiddleware(req, res, next);
  });

  // Configure Auth0
  app.use(auth(config));

  // Add security headers
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  // User info route
  app.get('/api/user', async (req: any, res: express.Response) => {
    console.log('Received request for /api/user');
    try {
      if (req.oidc?.isAuthenticated()) {
        console.log('User is authenticated via req.oidc');
        const userInfo = req.oidc.user;
        console.log('User info from Auth0:', userInfo);

        if (userInfo) {
          const user = {
            id: userInfo.sub,
            email: userInfo.email,
            firstName: userInfo.given_name,
            lastName: userInfo.family_name,
            profileImageUrl: userInfo.picture,
          };
          await storage.upsertUser(user);
          res.json(user);
        } else {
          console.log('No user info found in req.oidc.user');
          res.status(401).json({ error: 'User info not found' });
        }
      } else {
        console.log('User is NOT authenticated via req.oidc');
        res.status(401).json({ error: 'Not authenticated' });
      }
    } catch (error) {
      console.error('Error in /api/user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}

export const isAuthenticated = (req: any, res: express.Response, next: express.NextFunction) => {
  if (req.oidc?.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};
