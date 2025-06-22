# NutriTracker

A modern nutrition tracking application built with React, Express, and PostgreSQL.

## Production Deployment Checklist

### Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
NODE_ENV=production
PORT=5050
CLIENT_URL=https://your-domain.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nutritracker

# Authentication
AUTH0_SECRET=your-auth0-secret
AUTH0_BASE_URL=https://your-domain.com
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret

# Security
SESSION_SECRET=your-session-secret
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info  # debug, info, warn, error
```

### Production Build Steps

1. Install dependencies:
```bash
npm install
```

2. Build the application:
```bash
npm run build
```

3. Start the production server:
```bash
npm start
```

### Security Considerations

1. Ensure all environment variables are properly set and secure
2. Use HTTPS in production
3. Keep dependencies up to date
4. Monitor rate limiting and adjust as needed
5. Regularly backup the database
6. Set up proper logging and monitoring

### Performance Optimization

The application includes:
- Compression middleware
- Static file caching
- Rate limiting
- Security headers
- Production error handling
- Winston logging

### Monitoring

Monitor the following:
- Server response times
- Error rates
- Rate limit hits
- Database performance
- Memory usage
- CPU usage

### Backup Strategy

1. Regular database backups
2. Environment variable backups
3. Application state backups
4. Log retention policy

## Development

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

### Testing

```bash
npm run check
npm run typecheck
```

## License

MIT 