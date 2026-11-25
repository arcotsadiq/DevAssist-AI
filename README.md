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

## Deploy

### MongoDB Atlas
1. Create a free cluster at https://www.mongodb.com/atlas.
2. Create a database user and allow your deployment host IP access (for a quick demo, Atlas network access can be configured appropriately; avoid broad access for production).
3. Copy the driver connection string.

### Backend on Render
1. Push this repository to GitHub.
2. Create a new **Web Service** in Render and select the repository.
3. Set **Root Directory** to `server`, **Build Command** to `npm install`, **Start Command** to `npm start`.
4. Add environment variables: `MONGODB_URI`, `GEMINI_API_KEY`, `CLIENT_ORIGIN` (your deployed frontend URL), and `NODE_ENV=production`.
5. Deploy and copy the backend URL.

### Frontend on Vercel
1. Import the same GitHub repository into Vercel.
2. Set **Root Directory** to `client`.
3. Add `VITE_API_URL` = your Render backend URL (no trailing slash).
4. Deploy. Add the Vercel URL to the backend's `CLIENT_ORIGIN` on Render and redeploy.

## Important notes
- The Gemini API key belongs only in the backend environment variables. Never put it in `VITE_*` variables or frontend code.
- This is a portfolio/demo project. Add authentication, rate limiting, audit logs and stronger authorization before using it with real customer data.
- AI output can be wrong. Treat generated priority and suggested replies as recommendations that a human reviews.
