# Audit Report — Lost And Found Platform

## 1. Product purpose

This repository implements a university-focused lost-and-found platform for Pradita University. It supports authenticated users reporting lost or found items, viewing a public catalog, identifying likely matches between lost and found reports, sending item inquiries, and tracking report lifecycle status such as returned and archived items.

The current source-of-truth implementation is a full-stack app using React + Vite on the frontend and Express + Prisma + SQLite on the backend. The actual code matches the project requirements described in the README and the requirement specification.

## 2. Documented MVP vs. implemented MVP

### Documented MVP
The platform MVP is centered on these core capabilities:

- user registration and login with Pradita email validation
- creating lost or found item reports
- browsing a public catalog and filtering by report type, category, and location
- automatic match detection between lost and found reports
- ownership-safe inquiry and return-state transitions
- archive/retention handling for expired and returned items

### Implemented MVP
The implemented code currently supports the documented MVP in the backend and the SPA frontend structure. The core evidence is in:

- `apps/api/src/routes/auth.routes.ts`
- `apps/api/src/routes/items.routes.ts`
- `apps/api/src/routes/domain.routes.ts`
- `apps/api/src/services/matching.ts`
- `apps/api/src/services/returned-item-cleanup.ts`
- `apps/api/src/services/item-archiving.ts`
- `apps/api/src/lib/schemas.ts`
- `apps/api/src/lib/validation.ts`
- `apps/web/src/...` pages and components

### Existing working features
- Email-based login and registration with university domain enforcement
- Session authentication and password change flow
- Lost/found report creation, editing, soft deletion, and return completion
- Public catalog with search and pagination
- Match-score generation between opposite report types based on category, overlap keywords, and campus location
- Expired report archiving and cleaned-up returned items after the retention cutoff
- Dashboard summary, personal match recommendations, and inquiry status flows

### Relevant defects and gaps
The baseline implementation is already largely aligned with the documented MVP. A small but important validation gap was found during the audit: blank optional strings were being treated as real values, and the found-item operating-hour rule was enforced only in the route layer instead of the canonical validation schema. Both issues were corrected in the shared validation path so that every API entry point enforces the same business rules.

## 3. Business rules in the codebase

Key rules currently enforced in the code:

- Only `@student.pradita.ac.id` and `@pradita.ac.id` emails are accepted for registration.
- Lost reports require title, category, location, and incident date.
- Found reports require an uploaded image and optionally operating-hour validation for meet-up time.
- Returned items are excluded from active reports and are deleted after the configured retention period.
- Match scoring only compares active reports whose types are opposite.
- Match score requires a minimum threshold of 30 points to be recommended.
- Report expiration is enforced through `expiresAt` and `archivedAt` handling.
- Item ownership and mutation actions are restricted to the reporter.

## 4. Existing tests and coverage

Current automated tests cover the system's domain logic in two files:

- `apps/api/src/services/matching.test.ts`
- `apps/api/src/services/returned-item-cleanup.test.ts`

They validate the match engine and the returned-item retention logic.

## 5. Startup and test commands

Root workspace commands:

- `npm install`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run dev:api`
- `npm run dev:web`
- `npm run build:api`
- `npm run build:web`
- `npm run typecheck:api`
- `npm run typecheck:web`

API package tests:

- `npm test --workspace=@lost-and-found/api`

## 6. Files likely to require modification

Production/business logic:

- `apps/api/src/services/matching.ts`
- `apps/api/src/services/item-archiving.ts`
- `apps/api/src/services/returned-item-cleanup.ts`
- `apps/api/src/lib/schemas.ts`
- `apps/api/src/routes/auth.routes.ts`
- `apps/api/src/routes/items.routes.ts`
- `apps/api/src/routes/domain.routes.ts`

Frontend references:

- `apps/web/src/pages/*`
- `apps/web/src/api/client.ts`

## 7. Known discrepancies between docs and implementation

- The README describes a prototype with localStorage and a broad design document, while the source code has evolved to a backend-based Express + Prisma + SQLite architecture.
- The implementation is more complete than the older documentation suggests, but the repository does not currently contain a clearly written MVP story matrix or explicit test inventory aligned to those stories.
- The task requires explicit acceptance criteria and at least five concrete unit test files, which the current repository does not yet formally include.

## 8. Five MVP user stories

### Story ID: MVP-01
As a student, I want to register and log in using my Pradita email account, so that I can access the lost-and-found system securely.

Business justification: Authentication is the base requirement for user ownership, access control, and protected item management.

Current status: Implemented in `auth.routes.ts` and `services` secured by Prisma session logic.

Acceptance criteria:
- Given a user with an email ending in `@student.pradita.ac.id` or `@pradita.ac.id`, when they register, then the system accepts the account and assigns the correct role on the server.
- Given an invalid email domain, when registration is attempted, then the API rejects the request with a validation error.
- Given the correct email and password, when the user logs in, then a session is created and the current-user endpoint succeeds.
- Given an incorrect password, when the login request is submitted, then the API returns an authentication error.

Relevant modules: `apps/api/src/routes/auth.routes.ts`, `apps/api/src/lib/schemas.ts`, `apps/api/src/lib/sessions.ts`

### Story ID: MVP-02
As a reporter, I want to create a lost or found item report with the required details and validation, so that records are complete and usable for matching.

Business justification: A report is the central data object in the system; incomplete or invalid reports reduce trust and make matching unreliable.

Current status: Implemented in `items.routes.ts` and `itemCreateSchema` validation.

Acceptance criteria:
- Given a lost item report without category, location, or incident date, when it is submitted, then the API rejects it.
- Given a found item report without an image, when it is submitted, then the API rejects it.
- Given valid data for either report type, when the item is created, then the API persists the record with the correct `reportType` and `status`.
- Given a found report with a meet-up time outside the university operating range, when it is submitted, then the API rejects it.

Relevant modules: `apps/api/src/routes/items.routes.ts`, `apps/api/src/lib/schemas.ts`

### Story ID: MVP-03
As a user, I want to search the public catalog and filter active reports by category, status, and location, so that I can find relevant items quickly.

Business justification: Catalog search is the discoverability layer that makes the reporting system useful for recovery.

Current status: Implemented in `items.routes.ts` with query validation and filtering logic.

Acceptance criteria:
- Given a query string and active reports, when the catalog is requested, then the results match the search keywords in title, description, or location.
- Given a valid `reportType`, `status`, `category`, or `location` filter, when the API is called, then only matching active reports are returned.
- Given a `sort` parameter of `newest` or `oldest`, when the request is processed, then results are ordered as requested.
- Given an invalid page or page size, when the query is processed, then the API rejects it with validation errors.

Relevant modules: `apps/api/src/routes/items.routes.ts`, `apps/api/src/lib/validation.ts`, `apps/api/src/lib/schemas.ts`

### Story ID: MVP-04
As a user, I want the system to surface likely matches between lost and found reports, so that I can recover the correct item with minimal manual searching.

Business justification: Match detection is the core differentiation of the platform and the main value proposition for lost-and-found handling.

Current status: Implemented in `matching.ts` and used in `domain.routes.ts`.

Acceptance criteria:
- Given a lost item and a found item with matching category, overlapping keywords, and matching campus location, when them are compared, then the score exceeds the threshold.
- Given unrelated reports without shared category, location, or keywords, when matched, then the score remains below threshold.
- Given equivalent free-form locations with spacing, punctuation, and case differences, when normalized, then they count as a location match.
- Given only whitespace or empty location values, when normalized, then they do not receive location points.

Relevant modules: `apps/api/src/services/matching.ts`, `apps/api/src/routes/domain.routes.ts`

### Story ID: MVP-05
As a reporter, I want returned items to remain visible for a short retention period and then be purged automatically, so that the system keeps accurate and timely data without indefinite stale records.

Business justification: A retention mechanism prevents the system from holding onto stale returned records while preserving auditability and cleanup discipline.

Current status: Implemented in `returned-item-cleanup.ts` and `item-archiving.ts`.

Acceptance criteria:
- Given a returned item older than the configured cutoff, when the cleanup job runs, then the item is deleted.
- Given a returned item newer than the cutoff, when the cleanup job runs, then it remains in the database.
- Given non-returned active reports, when cleanup runs, then they are preserved.
- Given the retention cutoff calculation, when the date is evaluated, then the result matches the configured business rule of three days.

Relevant modules: `apps/api/src/services/returned-item-cleanup.ts`, `apps/api/src/services/item-archiving.ts`

## 9. Current audit conclusion

The repository already contains a mature MVP implementation that matches the project brief. The missing work is mostly about formalizing the audited facts, documenting the five core user stories, and creating unit-test coverage that proves the business rules in a way that is reviewable and reproducible.
