# Cellar AI

Cellar AI is a wine expert assistant with a Next.js + CopilotKit frontend and a Python FastAPI + LangGraph backend that streams AG-UI-compatible events over SSE.

## Repo layout
- `frontend/` – Next.js app with premium chat UI and structured inline cards
- `backend/` – FastAPI SSE backend with modular mock wine tools
- `tests/` – backend test coverage

## Local development

### Backend
```bash
/Users/bhandary/.local/bin/python3.11 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Set `NEXT_PUBLIC_AGENT_URL` if the backend is not running at `http://localhost:8000/run_sse`.

## Environment variables

### Frontend
- `NEXT_PUBLIC_AGENT_URL` – backend SSE endpoint URL

### Backend
- `CELLAR_AI_PROVIDER_MODE` – `mock` by default; abstraction boundary for future live providers

## Endpoints
- `POST /run`
- `POST /run_sse`
- `GET /health`

## Notes
- Tool providers are mocked behind a clear abstraction boundary
- Backend targets Python 3.11
- Frontend and backend are independently deployable

## Railway deployment
This repository deploys as two Railway services:

- backend service from the repository root using the root `Dockerfile`
- frontend service from `frontend/` using `frontend/Dockerfile`

Frontend production env vars:
- `NEXT_PUBLIC_AGENT_URL` – should point to the backend `/run_sse` endpoint

Recommended Railway mapping:
- backend service: deploy from repo root using the root `Dockerfile`
- frontend service: deploy from `frontend/` using `frontend/Dockerfile`

Important: if the UI domain is serving backend JSON, the UI service is pointed at the wrong root/Dockerfile. In Railway, reconfigure the `cellar-ai-ui` service to deploy with `frontend` as the root path (or `--path-as-root frontend`) so it builds from `frontend/Dockerfile` instead of the repository root `Dockerfile`.
