# Operations Guide

## 1. Service Overview

This repository contains:
- `backend/`: Express API for auth, todos, and dashboard data.
- `frontend/`: Vite + React web app that consumes the backend API.

The current backend implementation uses an in-memory store. That is acceptable for local verification and release handover documentation, but it is not durable storage. Any backend restart clears app data and sessions.

## 2. Runtime Commands

Backend local run:

```bash
cd backend
cp .env.example .env
npm ci
npm start
```

Frontend local run:

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

Build validation:

```bash
cd backend
npm ci
npm run build
npm test
```

```bash
cd frontend
npm ci
npm run lint
npm run test
npm run build
```

## 3. Environment Variables

Backend:

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `PORT` | No | `3000` | HTTP listen port |
| `NODE_ENV` | No | `development` | Controls secure-cookie production behavior |
| `LOG_LEVEL` | No | `info` | Minimum structured log level |
| `SERVICE_NAME` | No | `todo-api` | Service identifier in logs and health output |
| `RELEASE_VERSION` | No | `dev` | Deploy version in logs and health output |

Frontend:

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | No | `/api/v1` | API origin and base path for browser requests |

## 4. Health And Observability

Health endpoint:
- `GET /health`
- Expected `200` payload:

```json
{
  "data": {
    "status": "ok",
    "service": "todo-api",
    "environment": "production",
    "version": "2026.04.05"
  }
}
```

Structured logging baseline:
- Logs are emitted to stdout as JSON.
- Startup emits `server.started`.
- Every completed request emits `request.completed` with method, path, status code, duration, and request ID.
- Handled API errors emit `request.failed`.
- Unexpected `500` paths emit `request.crashed`.

Correlation:
- Every response includes `x-request-id`.
- Every API error payload includes `error.requestId`.
- Use both values to trace a failing request from browser or reverse proxy to application logs.

Error monitoring baseline:
- This repo does not ship with an external SaaS error monitor yet.
- Minimum production expectation is platform log collection plus alerts on `/health` failures and elevated `5xx` rates.
- Recommended next step is adding a managed error monitor such as Sentry or Datadog APM once persistence and production hosting are finalized.

## 5. Known Operational Risks

- Data is ephemeral because the backend store is in memory.
- Sessions are lost on backend restart for the same reason.
- No database migrations, backup process, or persistence recovery path exists yet.
- No background job, queue, or rate-limit layer exists yet.
- Cross-origin deployment is not hardened yet for cookie auth.

## 6. Incident Triage

1. Confirm `/health` response and release version.
2. Reproduce the failing route and capture `x-request-id`.
3. Search backend logs for that request ID.
4. Determine whether the failure is an expected `4xx` contract issue or an unexpected `500`.
5. Roll back if the deploy caused sustained `/health` failure or elevated `5xx` errors.
