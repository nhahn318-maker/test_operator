# Test Plan

## 1. Objective

This document defines the phase 3 testing strategy and CI quality gates for the todo fullstack web app delivered by backend issue `#3` and frontend issue `#4`.

Goals:
- Protect the auth, todo, and dashboard flows that define the product's critical path.
- Make the existing automated coverage explicit by testing layer.
- Keep CI fast enough to run on every push and pull request to `main`.
- Record defects and follow-up gaps discovered while validating issue `#5`.

## 2. Scope

In scope:
- Backend auth, todo, and dashboard API behavior.
- Frontend route protection, auth flows, dashboard rendering, and todo interactions.
- Minimal CI gates for install, lint, build, and automated tests.

Out of scope:
- Full browser automation in CI.
- Performance, load, and security scanning.
- Cross-browser matrix testing.

## 3. Risk-Based Coverage Targets

| Area | Risk | Why it matters | Required coverage |
| --- | --- | --- | --- |
| Authentication | High | Broken auth blocks protected features and risks data exposure. | Backend integration coverage, frontend auth-flow coverage, manual end-to-end smoke coverage |
| Todo CRUD | High | This is the core product workflow and highest regression surface. | Backend integration coverage, frontend create/update coverage, manual delete coverage |
| Dashboard summary | High | The dashboard is the first authenticated screen and depends on correct aggregation. | Backend integration coverage, frontend dashboard rendering coverage |
| Ownership isolation | High | Cross-user data access is a security defect. | Backend integration coverage |
| Validation and error handling | Medium | Invalid requests are common and must return stable contracts. | Backend integration coverage today, targeted follow-up coverage for UI errors |
| Build and lint health | Medium | Broken compile or lint should fail before review. | CI gate |
| End-to-end browser path | Medium | Confirms the integrated frontend and backend work together. | Manual smoke now, automate later |

## 4. Automated Coverage

### 4.1 Backend integration tests

Current suite: `backend/tests/api.test.ts`

Covered:
- Health endpoint contract.
- Register flow, cookie issuance, current-user lookup, and logout behavior.
- Duplicate registration conflict handling.
- Protected-route enforcement.
- Todo create, read, update, delete, filter, pagination, and dashboard aggregation.
- Default todo sorting behavior.
- Cross-user ownership isolation.

Known gaps:
- Explicit login success and login failure scenarios.
- Broader request validation edge cases for malformed payloads and query params.
- More dashboard ranking edge cases.

### 4.2 Frontend integration tests

Current suite: `frontend/src/test/App.test.tsx`

Covered:
- Redirecting unauthenticated users to the auth screen.
- Authenticated dashboard rendering with summary data and todo content.
- Create and complete flows from the dashboard.
- Registration and sign-out flow.

Known gaps:
- Sign-in validation and server-error states.
- Delete flow from the UI.
- Empty dashboard state coverage.
- Session expiry and re-authentication handling.

### 4.3 Unit test strategy

The codebase currently gets better risk reduction from integration coverage than from isolated unit tests. As the app grows, add focused unit tests around:
- Backend validation helpers and error mapping utilities.
- Backend service functions with pure business rules.
- Frontend client-side validation helpers and date-formatting helpers.

## 5. E2E Strategy

No browser automation framework is installed yet. For issue `#5`, end-to-end coverage is a manual smoke path that validates the running frontend and backend together.

Manual smoke checklist:
1. Register a new user.
2. Confirm redirect to the dashboard.
3. Create a todo with title, description, and due date.
4. Mark a todo complete and verify dashboard counts update.
5. Edit a todo and verify changes persist.
6. Delete a todo and verify it disappears from the list and summary.
7. Log out and confirm protected routes redirect to auth.
8. Request a protected API route without auth and confirm `401`.

Recommended follow-up automation:
- Add Playwright with one happy-path auth-to-dashboard scenario.
- Seed deterministic data for repeatable browser tests.
- Keep automated e2e coverage to one or two critical flows so CI stays fast.

## 6. CI Quality Gates

The required gate for every push and pull request is implemented in `.github/workflows/ci.yml`.

Backend:
- `npm ci`
- `npm run build`
- `npm test`

Frontend:
- `npm ci`
- `npm run lint`
- `npm run test`
- `npm run build`

Gate policy:
- Any failing command blocks merge.
- Checks should stay deterministic and complete quickly.
- Browser e2e automation is intentionally not required yet.

## 7. Validation Commands

Backend:

```bash
cd backend
npm ci
npm run build
npm test
```

Frontend:

```bash
cd frontend
npm ci
npm run lint
npm run test
npm run build
```

## 8. Defect Log

Defects found during issue `#5` validation:
- Fixed: `frontend/package-lock.json` was out of sync with `frontend/package.json`, causing `npm ci` to fail and breaking the frontend CI gate.

Follow-up gaps to route later if needed:
- No automated browser e2e coverage yet.
- No frontend coverage for auth failure states or delete interactions.
- No backend tests yet for login failure and wider validation boundaries.

## 9. Exit Criteria

Issue `#5` is complete when:
- `docs/TEST_PLAN.md` reflects the current repo state.
- CI enforces the minimal backend and frontend quality gates.
- The validation commands in this plan pass locally.
- Defects found during validation are fixed or explicitly documented for follow-up.
