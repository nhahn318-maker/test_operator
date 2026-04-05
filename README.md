# test_operator

Backend implementation for issue `#3` lives in [`backend/`](backend/) and exposes the phase-2 auth, todo, and dashboard API described in [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md).

Frontend implementation for issue `#4` lives in [`frontend/`](frontend/).

Release-readiness artifacts for issue `#6` live in:
- [`docs/DEPLOYMENT_CHECKLIST.md`](docs/DEPLOYMENT_CHECKLIST.md)
- [`docs/OPERATIONS.md`](docs/OPERATIONS.md)
- [`docs/HANDOVER.md`](docs/HANDOVER.md)

## Backend

Stack:
- TypeScript
- Express
- Cookie-based session auth
- In-memory repository adapter for phase 2 build/test coverage
- Vitest + Supertest

Environment template:

```bash
cp backend/.env.example backend/.env
```

Run locally:

```bash
cd backend
npm ci
npm start
```

The API starts on `http://localhost:3000` by default.

Development mode:

```bash
cd backend
npm ci
npm run dev
```

Run tests:

```bash
cd backend
npm ci
npm test
```

Build:

```bash
cd backend
npm ci
npm run build
```

Health check:

```bash
curl http://localhost:3000/health
```

Implemented endpoints:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/todos`
- `POST /api/v1/todos`
- `GET /api/v1/todos/:todoId`
- `PATCH /api/v1/todos/:todoId`
- `DELETE /api/v1/todos/:todoId`
- `GET /api/v1/dashboard`

## Frontend

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

Default frontend API base URL is `/api/v1`. Override it with `VITE_API_BASE_URL` when the backend runs on a different origin.

## Frontend Verification

```bash
cd frontend
npm ci
npm run lint
npm run test
npm run build
```
