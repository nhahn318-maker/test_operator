# High-Level Design

## 1. Purpose

This document defines the phase 1 high-level design for the Todo Fullstack Web App described in `docs/PRD.md`. The design covers system architecture, component boundaries, data model, authentication, error handling, and testing boundaries needed to guide later implementation.

## 2. Scope And Assumptions

### 2.1 Scope
- Authenticated single-account todo management.
- Dashboard summary for the signed-in user.
- HTTP API contract for auth, todos, and dashboard data.
- Test strategy boundaries for frontend, backend, and integration layers.

### 2.2 Assumptions
- Phase 1 supports personal task lists only. No shared workspaces or team access.
- The web app is delivered as a browser-based client plus a server-side API.
- Session-based authentication using secure HTTP-only cookies is preferred for the web-first product.
- A relational database is the default persistence layer because the domain is structured and requires ownership constraints.
- Dashboard values are derived from live task data, not from a separate analytics pipeline.

## 3. Architectural Goals

- Keep the first release simple enough to build quickly and test thoroughly.
- Enforce strict data isolation so users only access their own tasks.
- Separate UI, API, domain logic, and persistence concerns to reduce coupling.
- Define stable contracts early so frontend and backend work can proceed independently.
- Support unit, integration, and end-to-end testing without custom workarounds.

## 4. System Context

### 4.1 External Actors
- End user using a desktop or mobile browser.
- Browser client rendering auth screens, dashboard, and todo views.
- Backend application serving API requests and enforcing auth.
- Relational database storing users, sessions, and todo data.

### 4.2 Logical Context Diagram

```text
+-------------+      HTTPS       +------------------+      SQL      +------------------+
|   Browser   | <--------------> |  Web/API Server  | <-----------> | Relational DB    |
| React-style |                  | Auth + Todo API  |               | users/todos/...  |
+-------------+                  +------------------+               +------------------+
```

## 5. Component Boundaries

### 5.1 Frontend
- Auth pages: sign up, sign in, sign out action, protected-route handling.
- Dashboard page: summary cards and prioritized task list for the current user.
- Todo page or module: list, filters, create form, update form, complete toggle, delete action.
- API client layer: typed request/response handling, cookie-aware requests, error mapping.
- Session state layer: current-user bootstrap and auth-aware route guards.

Frontend responsibilities:
- Render user interactions and validation feedback.
- Call backend APIs and display structured errors.
- Avoid embedding business rules that belong on the server, except basic form validation and presentation logic.

Frontend dependency rules:
- Route modules depend on shared UI components and the API client, not on persistence concerns.
- Session state is the single source of truth for whether protected routes may render.
- Dashboard and todo views consume backend-derived data and should not recalculate ownership or security rules client-side.

### 5.2 Backend
- Auth controller layer: register, login, logout, current-session fetch.
- Todo controller layer: CRUD and completion transitions for authenticated users.
- Dashboard controller layer: aggregate summary counts and prioritized tasks.
- Service layer: input validation, business rules, authorization checks, and transaction boundaries.
- Repository or data-access layer: database queries isolated from HTTP transport logic.

Backend responsibilities:
- Authenticate requests and resolve the current user.
- Authorize all access by resource ownership.
- Enforce consistent error contracts and status codes.
- Persist and query user, session, and todo data.

Backend dependency rules:
- Controllers map HTTP requests to typed service inputs and shape HTTP responses.
- Services own business rules, resource ownership checks, and cross-module orchestration.
- Repositories own storage queries and may not contain transport-specific response formatting.

### 5.3 Database
- Stores canonical user, session, and todo records.
- Enforces uniqueness, foreign keys, and ownership linkage.
- Supports indexed queries for task listing and dashboard summary generation.

### 5.4 Boundary Summary

| Layer | Owns | Must not own |
| --- | --- | --- |
| Frontend routes/components | Rendering, local form state, optimistic UX decisions, route guards | Authorization rules, canonical business validation, persistence access |
| API client/session layer | Request transport, cookie-aware session bootstrap, response parsing | Domain decisions, direct DOM rendering |
| Backend controllers | HTTP parsing, auth middleware composition, response envelopes | Query details, reusable domain logic |
| Backend services | Validation, task lifecycle rules, dashboard aggregation, ownership enforcement | HTTP-only concerns, browser state |
| Repositories/database | Record storage, filtering, indexes, relational constraints | UI logic, session presentation |

## 6. Module View

### 6.1 Backend Modules
- `auth`: registration, password verification, session issuance, logout.
- `users`: current authenticated user profile lookup.
- `todos`: create, list, update, delete, and state transitions.
- `dashboard`: derived summaries and recent-task selection.
- `common`: validation, errors, auth middleware, response serialization.

### 6.2 Frontend Modules
- `routes/auth`
- `routes/dashboard`
- `routes/todos`
- `components/forms`
- `components/task-list`
- `lib/api-client`
- `lib/session`
- `lib/types`

## 7. Data Model

### 7.1 Entities

#### User
- `id`: UUID, primary key.
- `email`: unique, normalized.
- `password_hash`: secure one-way hash.
- `display_name`: optional or required based on implementation choice; recommended optional in phase 1.
- `created_at`
- `updated_at`

#### Session
- `id`: UUID, primary key.
- `user_id`: foreign key to `users.id`.
- `token_hash`: hashed session token or opaque identifier reference.
- `expires_at`
- `created_at`
- `revoked_at`: nullable.

#### Todo
- `id`: UUID, primary key.
- `user_id`: foreign key to `users.id`.
- `title`: required, max length defined by API validation.
- `description`: optional text.
- `status`: enum with `active` and `completed`.
- `due_date`: nullable timestamp or date.
- `created_at`
- `updated_at`
- `completed_at`: nullable timestamp.

### 7.2 Relationships
- One `User` has many `Todo` records.
- One `User` has many `Session` records.
- Every `Todo` belongs to exactly one `User`.

### 7.3 Indexing Recommendations
- Unique index on `users.email`.
- Index on `todos.user_id, todos.created_at desc` for default list view.
- Index on `todos.user_id, todos.status` for dashboard counts and filters.
- Index on `sessions.user_id`.
- Unique index on `sessions.token_hash`.

## 8. Authentication And Authorization Design

### 8.1 Authentication Model
- Use email and password credentials for phase 1.
- On successful login or registration, the server creates a session and returns a secure HTTP-only cookie.
- Cookie settings should include `HttpOnly`, `Secure` in production, and `SameSite=Lax` by default.
- Session expiration should be bounded and renewable by later design if needed; initial implementation can use a fixed TTL.

### 8.2 Authorization Model
- All todo and dashboard endpoints require an authenticated session.
- Resource access is scoped by `user_id = current_user.id`.
- Missing or invalid session returns `401 Unauthorized`.
- Access to another user's resource should be prevented by query scoping first; if a targeted resource is not owned by the user, return `404 Not Found` to avoid leaking existence.

### 8.3 Password Handling
- Passwords are never stored or logged in plain text.
- Use a modern password hashing algorithm such as Argon2id or bcrypt with strong work factors.
- Registration and login should apply generic failure messaging so invalid email and invalid password do not reveal which field was incorrect.

## 9. Request Flow

### 9.1 Register Or Login
1. User submits credentials from the browser.
2. Frontend calls auth API.
3. Backend validates payload and checks credentials or creates the user.
4. Backend creates a session and sets the session cookie.
5. Frontend fetches current-session data and routes to dashboard.

### 9.2 Todo Mutation
1. User submits create or update action.
2. Frontend sends an authenticated API request.
3. Backend resolves current user from session middleware.
4. Service validates business rules and persists changes.
5. API returns the canonical todo payload for UI refresh.

### 9.3 Dashboard Load
1. Frontend requests dashboard summary after session bootstrap.
2. Backend aggregates counts from the current user's todos.
3. Backend returns metrics plus a prioritized recent-task subset.
4. Frontend renders summary cards and task widgets.

### 9.4 Protected Route Bootstrap
1. Browser loads a protected route such as dashboard or todos.
2. Frontend session bootstrap calls the current-session endpoint using the existing cookie.
3. Backend validates the session record and returns the authenticated user or `401`.
4. Frontend either renders the protected page or redirects to sign in.

## 10. Error Model

### 10.1 Principles
- Use a single JSON error envelope for all non-2xx responses.
- Separate stable machine-readable error codes from user-facing messages.
- Include field-level validation details when the client can take corrective action.
- Do not leak internal stack traces or database details.

### 10.2 Standard Error Envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request body is invalid.",
    "details": [
      {
        "field": "email",
        "issue": "Must be a valid email address."
      }
    ],
    "requestId": "req_123"
  }
}
```

### 10.3 Canonical Error Codes
- `VALIDATION_ERROR`: malformed input or failed constraints.
- `UNAUTHENTICATED`: missing or invalid session.
- `FORBIDDEN`: authenticated but not permitted for a non-resource-scoped action; expected to be rare in phase 1.
- `NOT_FOUND`: resource absent or not owned by current user.
- `CONFLICT`: duplicate email registration or other uniqueness conflict.
- `RATE_LIMITED`: optional guard for auth abuse.
- `INTERNAL_ERROR`: unexpected server failure.

## 11. Dashboard Design

### 11.1 Summary Metrics
- `totalTodos`
- `activeTodos`
- `completedTodos`

### 11.2 Prioritized Task Subset
- Return up to a small fixed number of tasks, recommended 5.
- Prioritize active tasks first, then most recently updated or nearest due date if available.
- Keep prioritization deterministic so frontend rendering is predictable and testable.

## 12. Testing Boundaries

### 12.1 Backend Unit Tests
- Password hashing and verification utilities.
- Auth service behavior for register, login, and logout.
- Todo service rules for ownership, status transitions, and validation.
- Dashboard aggregation logic.

### 12.2 API Integration Tests
- Register, login, current-session fetch, and logout.
- Protected endpoint access with and without a valid session.
- Todo create, list, update, complete, and delete flows.
- Ownership isolation between two users.
- Error contract snapshots for common failure modes.

### 12.3 Frontend Tests
- Auth form validation and redirect behavior.
- Protected-route behavior for unauthenticated users.
- Dashboard rendering from API payloads.
- Todo CRUD interactions and error-state display.

### 12.4 End-To-End Smoke Coverage
- Sign up or sign in.
- Create a todo.
- Mark the todo completed.
- Confirm dashboard counts update correctly.
- Sign out and verify protected pages are blocked.

## 13. Observability And Operational Considerations

- Include request IDs in server logs and error responses.
- Log auth and mutation events at audit-friendly points without sensitive payloads.
- Track basic API latency and error rate metrics.
- Keep session invalidation explicit on logout.

## 14. Risks And Tradeoffs

- Session cookies simplify web auth but require deliberate CSRF protection in implementation; phase 1 should pair `SameSite=Lax` with CSRF mitigation for unsafe cross-site flows if the app later broadens embedding or cross-origin usage.
- Dashboard aggregation on demand is simpler than precomputed counters, but very large task volumes may require optimization later.
- Returning `404` for unauthorized resource access improves privacy but can make operator debugging less direct without request tracing.

## 15. Acceptance Criteria For This Design

- The design separates frontend, backend, and persistence responsibilities clearly enough that implementation tasks can be split without redefining boundaries.
- The component model identifies auth, dashboard, todo, session, and shared modules with clear dependency rules.
- The entity model covers users, sessions, and todos with ownership constraints that support auth, dashboard, and CRUD requirements from `docs/PRD.md`.
- The auth design defines session handling, password storage expectations, and unauthorized or hidden-resource behavior.
- The error model defines a shared envelope and canonical codes that can be reused across all phase 1 endpoints.
- The request flows and testing boundaries are specific enough to guide backend, frontend, and test issue follow-up work.
