# NutriFix

NutriFix is a health application that transforms your blood test results into personalized daily meal plans and lifestyle tips. By uploading or entering lab data, the app analyzes key biomarkers to detect deficiencies and suggests actionable improvements, allowing you to track progress over time.

## 🚀 Tech Stack

- **Frontend:** React, Vite, TailwindCSS
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (Neon Serverless), Drizzle ORM
- **Authentication:** Auth0
- **AI Integration:** Mistral AI (for analysis and recipe recommendations)

## 📁 Project Structure

The repository is structured as a monorepo containing both the frontend and backend:

- `frontend/`: The React application built with Vite.
- `backend/`: The Node.js/Express server that serves the API and the statically built frontend.
- `shared/`: Shared TypeScript schemas and types used by both frontend and backend (e.g., Drizzle schema).

## 🛠️ Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory and populate it with the following required variables:

```env
# Database
DATABASE_URL=your_neon_postgres_url

# Authentication (Auth0)
AUTH0_SECRET=your-auth0-secret
AUTH0_BASE_URL=http://localhost:5050
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret

# Server Configuration
SESSION_SECRET=your-secure-session-secret
```

### 3. Database Initialization
Push the Drizzle schema to your database:
```bash
npm run db:push
```

### 4. Start the Development Server
```bash
npm run dev
```
This command concurrently starts the Vite dev server for the frontend and the `tsx` watcher for the backend API. The app will be available at `http://localhost:5050`.

## 📦 Production Deployment

The project is designed to be deployed as a monolithic application where the Express backend serves the pre-built React frontend. This makes it easily deployable on platforms like Render, Heroku, or standard VPS environments.

### Build the Application
```bash
npm run build
```
This script will build the Vite frontend into `dist/public` and bundle the Express backend using `esbuild` into `dist/index.js`.

### Start the Server
```bash
# Ensure you set NODE_ENV=production and all production environment variables
npm start
```

### Deployment Checklist
1. Provide all production Environment Variables (including `CLIENT_URL` and `NODE_ENV=production`).
2. Run database migrations/schema push on your production database.
3. Use `npm install` and `npm run build` during the deployment step.
4. Run `npm start` as your start command.

## 📄 License

MIT
