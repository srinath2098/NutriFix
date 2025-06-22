declare module 'express-openid-connect' {
  import { Request, Response, NextFunction } from 'express';

  interface ConfigParams {
    authRequired?: boolean;
    auth0Logout?: boolean;
    secret: string;
    baseURL: string;
    clientID: string;
    issuerBaseURL: string;
    clientSecret: string;
    routes?: {
      login?: string | false;
      logout?: string;
      callback?: string;
    };
    session?: {
      absoluteDuration?: number;
      rolling?: boolean;
      rollingDuration?: number;
      cookie?: {
        secure?: boolean | 'auto';
        httpOnly?: boolean;
        sameSite?: 'Lax' | 'Strict' | 'None';
        domain?: string;
        path?: string;
      };
    };
  }

  interface OpenIDRequest extends Request {
    oidc: {
      isAuthenticated: () => boolean;
      user?: {
        sub: string;
        email: string;
        given_name?: string;
        family_name?: string;
        picture?: string;
        [key: string]: any;
      };
    };
  }

  export function auth(params: ConfigParams): (req: Request, res: Response, next: NextFunction) => void;
  export function requiresAuth(): (req: Request, res: Response, next: NextFunction) => void;
}
