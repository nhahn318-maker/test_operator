# Frontend

React + TypeScript + Vite frontend for the todo app contract defined in `../docs/API_CONTRACT.md`.

## Features

- Email/password auth screens with protected routing
- Dashboard summary cards backed by `GET /api/v1/dashboard`
- Todo create, list, update, complete, and delete flows backed by `GET/POST/PATCH/DELETE /api/v1/todos`
- Frontend tests for auth redirect, dashboard rendering, and todo interactions

## Run

```bash
cp .env.example .env
npm install
npm run dev
```

By default the app targets `/api/v1`. Set `VITE_API_BASE_URL` if the backend is served from another origin, such as the local backend at `http://localhost:3000/api/v1`.

## Verify

```bash
npm run lint
npm run test
npm run build
```
