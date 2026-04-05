# test_operator

Backend implementation for issue `#9` lives in [`backend/`](/home/nhtony318/.worktrees/test_operator/tes-7/backend) and exposes the phase-2 auth, todo, and dashboard API described in [`docs/API_CONTRACT.md`](/home/nhtony318/.worktrees/test_operator/tes-7/docs/API_CONTRACT.md).

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
