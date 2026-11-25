# DevAssist AI — Intelligent Support & Developer Copilot

A full-stack AI support-ticket assistant built with React, Node.js, Express, MongoDB and Google Gemini.

## Features
- Create, view, update status, and delete support tickets.
- Ask Gemini to summarize an issue, classify it, estimate priority, and draft a response.
- Lightweight retrieval-augmented generation (RAG): relevant knowledge-base notes are retrieved and included in the AI prompt.
- REST API with input validation and centralized error handling.
- Responsive dashboard with search and status filters.

## Architecture
- `client/`: React + Vite frontend
- `server/`: Express REST API, Mongoose models, Gemini integration and retrieval logic
- MongoDB Atlas: persistent ticket storage
- Gemini API: AI analysis and response drafting

## Run locally

### Requirements
- Node.js 18+
- MongoDB local instance or MongoDB Atlas connection string
- Google AI Studio Gemini API key

### 1. Configure backend
```bash
cd server
cp .env.example .env
```
Fill in `MONGODB_URI` and `GEMINI_API_KEY`. Keep `.env` private; never commit it.

### 2. Start backend
```bash
npm install
npm run dev
```
API runs at `http://localhost:5000`. Health check: `http://localhost:5000/api/health`.

### 3. Start frontend (new terminal)
```bash
cd client
cp .env.example .env
npm install
npm run dev
```
Open the Vite URL shown in the terminal (usually `http://localhost:5173`).

## API overview
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/tickets` | List tickets; supports `?q=` and `?status=` |
| POST | `/api/tickets` | Create ticket |
| GET | `/api/tickets/:id` | Get one ticket |
| PATCH | `/api/tickets/:id` | Update ticket status |
| DELETE | `/api/tickets/:id` | Delete ticket |
| POST | `/api/ai/analyze` | Analyze a ticket using Gemini + retrieved knowledge |

## Deployment Status

Currently, DevAssist AI is configured to run locally.

- Frontend: React + Vite (`http://localhost:5173/`)
- Backend: Node.js + Express (`http://localhost:5000/`)
- Database: MongoDB Atlas (cloud-hosted database)

The application has not yet been deployed to Render or Vercel. It can be run locally by following the setup instructions above.

## Important notes
- The Gemini API key belongs only in the backend environment variables. Never put it in `VITE_*` variables or frontend code.
- This is a portfolio/demo project. Add authentication, rate limiting, audit logs and stronger authorization before using it with real customer data.
- AI output can be wrong. Treat generated priority and suggested replies as recommendations that a human reviews.
