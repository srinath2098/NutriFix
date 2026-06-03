import rateLimit from 'express-rate-limit';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth endpoints rate limit - more strict
export const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Mistral AI endpoints rate limit - more strict due to cost
export const mistralLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: 50, // limit each IP to 50 AI requests per windowMs (Mistral has good limits)
  message: 'Too many AI requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
