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

### Backend tests
```bash
source .venv/bin/activate
pytest -q tests/test_backend.py
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
