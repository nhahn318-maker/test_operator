# Test Plan

## 1. Objective

This document defines the phase 3 testing strategy and CI quality gates for the todo fullstack web app delivered in issues `#9` and `#10`.

Goals:
- Protect the auth, todo, and dashboard flows that define the product's critical path.
- Make existing automated coverage explicit by layer.
- Add a minimal CI gate that is fast enough to run on every push and pull request.
- Record gaps, risks, and any bugs discovered during validation.

## 2. Test Scope

In scope:
- Backend auth, todo, and dashboard behaviors.
- Frontend unauthenticated routing, dashboard rendering, and todo interactions.
- CI gates for install, lint, build, and automated tests.

Out of scope for this issue:
- Full browser-driven e2e automation in CI.
- Performance, load, and security scanning.
- Cross-browser matrix expansion beyond the default local browser/runtime used by current tooling.

## 3. Risk-Based Coverage Targets

| Area | Risk | Why it matters | Required coverage |
| --- | --- | --- | --- |
| Authentication | High | Broken auth blocks all protected functionality and can expose user data. | API integration coverage, frontend route/auth-state coverage, manual smoke path |
| Todo CRUD | High | This is the core user workflow and the main regression surface. | API integration coverage, frontend create/update coverage, manual delete flow |
| Dashboard summary | High | Dashboard is the landing experience after login and depends on correct aggregation. | API integration coverage, frontend rendering coverage |
| Ownership isolation | High | Data leakage across users is a security defect. | API integration coverage |
| Validation and error handling | Medium | Invalid inputs are common and must return stable error shapes. | API integration coverage, targeted UI validation/error-state coverage over time |
| Build/lint health | Medium | Broken compile or lint should fail before review. | CI gate |
| End-to-end browser flow | Medium | Confirms the app works across frontend/backend boundaries. | Manual smoke now, automate in a later issue |

## 4. Current Automated Coverage

### 4.1 Backend integration tests

Current suite: `backend/tests/api.test.ts`

Covered today:
- Register sets session cookie and normalizes email.
- Current-user lookup and logout behavior.
- Duplicate registration conflict contract.
- Protected route enforcement.
- Todo create, read, update, delete, filter, pagination, and dashboard aggregation.
- Cross-user ownership isolation.

Gaps to track:
- Explicit login success/failure scenarios.
- Validation edge cases across malformed auth and todo payloads.
- Additional dashboard prioritization edge cases.

### 4.2 Frontend integration tests

Current suite: `frontend/src/test/App.test.tsx`

Covered today:
- Unauthenticated users are redirected to login.
- Authenticated dashboard state renders summary and todo content.
- Create todo flow from the dashboard.
- Complete/update flow from the dashboard.

Gaps to track:
- Sign-in and sign-up validation/error states.
- Delete flow from the UI.
- Empty-state rendering.
- Session expiry/re-auth handling.

### 4.3 Unit test strategy

The current codebase is light on isolated unit tests and leans on integration tests. For this application shape, that is acceptable as a starting point because the main risk lives at module boundaries.

When more logic accumulates, add focused unit tests for:
- Backend validation helpers and error mapping utilities.
- Todo/dashboard service functions that contain pure business rules.
- Frontend date formatting helpers and client-side form validation helpers.

## 5. E2E Strategy

No browser automation framework is installed yet. For this issue, e2e coverage is defined as a minimal manual smoke test that validates the full stack using the running frontend and backend together.

Manual smoke checklist:
1. Register a new user.
2. Confirm redirect to the dashboard.
3. Create a todo with title, description, and due date.
4. Mark a todo complete and verify dashboard counts update.
5. Edit a todo and verify changes persist in the UI.
6. Delete a todo and verify it disappears from the dashboard/list.
7. Log out and confirm protected routes return to the auth page.
8. Attempt to access a protected API route without auth and confirm `401`.

Automation recommendation for follow-up work:
- Add Playwright with one happy-path auth-to-dashboard scenario.
- Reuse seeded test data and a deterministic backend test mode.
- Keep the automated e2e suite to one or two critical flows so CI time stays bounded.

## 6. CI Quality Gates

The minimal required gate for every push and pull request to `main` is:

### Backend
- `npm ci`
- `npm run build`
- `npm test`

### Frontend
- `npm ci`
- `npm run lint`
- `npm run test`
- `npm run build`

Gate policy:
- Any failing command blocks merge.
- Fast, deterministic checks are preferred over broad but flaky coverage.
- E2E automation is intentionally excluded from the initial required gate until a stable runner setup exists.

## 7. Execution Commands

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

Validation result for issue `#11`:
- No new blocking product defects were discovered while reviewing the existing automated coverage and running the repository quality checks.

Known quality gaps to route later if needed:
- Missing automated browser e2e coverage.
- Missing frontend error-state coverage for auth failures and destructive flows.
- Missing backend tests for login failure and broader validation boundaries.

## 9. Exit Criteria

Issue `#11` is complete when:
- `docs/TEST_PLAN.md` exists and reflects the current repo state.
- CI enforces the minimal backend and frontend quality gates.
- Local verification passes for the commands listed in this plan.
- Any new defects found during validation are documented or routed.
