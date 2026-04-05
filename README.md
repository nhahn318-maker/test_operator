# test_operator

Backend implementation for issue `#9` lives in [`backend/`](/home/nhtony318/.worktrees/test_operator/tes-8/backend) and exposes the phase-2 auth, todo, and dashboard API described in [`docs/API_CONTRACT.md`](/home/nhtony318/.worktrees/test_operator/tes-8/docs/API_CONTRACT.md).

Frontend implementation for issue `#10` lives in [`frontend/`](/home/nhtony318/.worktrees/test_operator/tes-8/frontend).

## Backend

Stack:
- TypeScript
- Express
- Cookie-based session auth
- In-memory repository adapter for phase 2 build/test coverage
- Vitest + Supertest

Run locally:

```bash
cd backend
npm install
npm start
```

The API starts on `http://localhost:3000` by default.

Development mode:

```bash
cd backend
npm install
npm run dev
```

Run tests:

```bash
cd backend
npm install
npm test
```

Build:

```bash
cd backend
npm install
npm run build
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
npm install
npm run dev
```

Default frontend API base URL is `/api/v1`. Override it with `VITE_API_BASE_URL` when the backend runs on a different origin.

## Frontend Verification

```bash
cd frontend
npm run lint
npm run test
npm run build
```
