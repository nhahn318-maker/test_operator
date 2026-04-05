# Deployment Checklist

This checklist is the phase 4 release baseline for issue `#12`.

## 1. Build Readiness

- Confirm issue dependency `#11` is closed.
- Confirm the release branch is cut from `main`.
- Confirm the local verification commands pass:
  - `cd backend && npm ci && npm run build && npm test`
  - `cd frontend && npm ci && npm run lint && npm run test && npm run build`
- Confirm the environment values are set from `.env.example`, `backend/.env.example`, and `frontend/.env.example`.

## 2. Runtime Configuration

Backend required at deploy time:
- `PORT`
- `NODE_ENV`
- `LOG_LEVEL`
- `SERVICE_NAME`
- `RELEASE_VERSION`

Frontend required at build time:
- `VITE_API_BASE_URL`

Deployment assumptions for this repo:
- The frontend is built as static assets.
- The backend serves the API and should run behind a reverse proxy or platform TLS terminator.
- Cookie auth is same-origin by default. If frontend and backend are split across origins later, add explicit CORS and cookie policy work before release.

## 3. Operational Checks

- Verify `GET /health` returns `200` and reports the expected `service`, `environment`, and `version`.
- Verify backend logs are captured from stdout in structured JSON.
- Verify every API response includes `x-request-id`.
- Verify non-2xx API responses include `error.requestId`.
- Verify platform log retention and alert routing are configured for production.

## 4. Smoke Test

1. Register a new user.
2. Confirm redirect or session bootstrap to the dashboard.
3. Create a todo.
4. Complete or edit a todo and confirm dashboard metrics update.
5. Delete a todo.
6. Log out and confirm protected API calls return `401`.
7. Call `GET /health` from the deployed environment.

## 5. Rollback Readiness

- Keep the previous deploy artifact or image available.
- Treat sustained `5xx` responses or failed `/health` checks as rollback triggers.
- Use `x-request-id` plus structured logs to isolate the failing request path before retrying rollout.
