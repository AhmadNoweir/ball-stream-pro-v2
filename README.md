# Ball Stream Pro

Ball Stream Pro is a full-stack football web application with:

- live and upcoming match tracking
- match detail views and comments
- real-time user chat and online presence
- a football-focused AI assistant
- user authentication and favourite teams

The frontend is a Vite + React + TypeScript app at the repo root. The backend is a separate Express + TypeScript app in `server/` backed by PostgreSQL through Prisma.

## Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion
- Backend: Node.js, Express, TypeScript, Socket.IO
- Database: PostgreSQL, Prisma ORM
- External APIs: football-data.org and Gemini

## Repository Layout

```text
.
|-- src/                 # Frontend source
|-- public/              # Frontend static assets
|-- server/
|   |-- src/             # Backend source
|   |-- prisma/          # Prisma schema and migrations
|   `-- seed.ts          # Optional demo data seed
|-- .env.example         # Environment variable template
|-- package.json         # Frontend scripts
`-- server/package.json  # Backend scripts
```

## Prerequisites

- Node.js 18 or newer
- npm
- A PostgreSQL database
- A football-data.org API key for match data
- A Gemini API key for the AI assistant

## Installation

Install dependencies for both apps:

```bash
npm install
npm --prefix server install
```

## Environment Setup

Create a root `.env` file from the template:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Update `.env` with real values:

```env
# Frontend
VITE_API_BASE_URL=http://localhost:3000/api

# Server
PORT=3000
CORS_ORIGIN=http://localhost:8080
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
JWT_SECRET=change-this-to-a-random-string
FOOTBALL_API_KEY=your-football-data-api-key
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_MAX_RETRIES=10
GEMINI_RETRY_BASE_DELAY_MS=1000
```

Notes:

- `VITE_API_BASE_URL` must include `/api`
- `CORS_ORIGIN` should match the frontend origin exactly
- the backend loads variables from the root `.env` file

## Database Setup

Generate the Prisma client:

```bash
npm --prefix server run db:generate
```

Apply migrations to your database:

```bash
npm --prefix server run db:migrate:deploy
```

For local development, you can also use:

```bash
npm --prefix server run db:migrate
```

Optional: seed demo users into the database:

```bash
npm --prefix server run db:seed
```

## Running Locally

Start the backend in one terminal:

```bash
npm --prefix server run dev
```

Start the frontend in another terminal:

```bash
npm run dev
```

Local URLs:

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:3000/api`
- Health check: `http://localhost:3000/api/health`

## Available Scripts

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test
npm run test:watch
```

### Backend

```bash
npm --prefix server run dev
npm --prefix server run build
npm --prefix server run start
npm --prefix server run db:generate
npm --prefix server run db:push
npm --prefix server run db:migrate
npm --prefix server run db:migrate:deploy
npm --prefix server run db:seed
```

## Production Build

Build the frontend:

```bash
npm run build
```

Build the backend:

```bash
npm --prefix server run build
```

Preview the frontend build locally:

```bash
npm run preview
```

Run the built backend locally:

```bash
npm --prefix server run start
```

## Deployment Notes

This repo is typically deployed as two services:

- Frontend: static deployment, for example Vercel
- Backend: Node web service, for example Render
- Database: PostgreSQL, for example Neon

Production environment variables usually look like this:

```env
VITE_API_BASE_URL=https://your-backend-domain/api
CORS_ORIGIN=https://your-frontend-domain
DATABASE_URL=postgresql://...
```

Important:

- keep `/api` in `VITE_API_BASE_URL`
- do not include a trailing slash in `CORS_ORIGIN`
- run `npm --prefix server run db:migrate:deploy` during backend deployment

## Features

- Authentication with JWT-based sessions
- Live/upcoming/finished match listing
- Match detail pages with team info, head-to-head stats, and comments
- Real-time chat using Socket.IO
- Favourite teams stored per user
- AI assistant grounded with current football match context

## Testing

Frontend unit test infrastructure is configured with Vitest:

```bash
npm run test
```

Playwright configuration is present in the repo, but there is currently no root npm script for end-to-end tests.

## Troubleshooting

### Frontend cannot reach the backend

Check:

- `VITE_API_BASE_URL` includes `/api`
- the backend is running
- `CORS_ORIGIN` matches the frontend origin exactly

### CORS preflight errors

Common causes:

- `CORS_ORIGIN` has the wrong domain
- `CORS_ORIGIN` includes a trailing slash
- the frontend was redeployed with an old `VITE_API_BASE_URL`

### Database connection issues

Check:

- `DATABASE_URL` is valid
- Prisma migrations have been applied
- your database allows connections from the backend environment

### AI responses fail

Check:

- `GEMINI_API_KEY` is set correctly
- `GEMINI_MODEL` is valid
- the provider is not temporarily overloaded

## License

This project is private. All rights reserved.
