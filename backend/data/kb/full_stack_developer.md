---
doc_type: role
profession: full_stack_developer
focus_area: Mixed
---

# Full Stack Developer — Interview Coaching Knowledge Base

## Role overview

Full stack interviews test end-to-end ownership: can you ship a feature from database to UI, debug across boundaries, and make pragmatic tradeoffs when layers conflict? Interviewers want integration thinking—stable API contracts, consistent validation, coherent error UX, and deployment awareness—not two shallow halves.

## Core competencies

- Frontend: components, state, routing, performance, accessibility basics
- Backend: APIs, auth, data modeling, caching, background jobs
- Integration: shared types or OpenAPI, error contracts, auth flows end-to-end
- Testing: unit, integration, E2E across stack; contract tests
- DevOps awareness: CI, environments, feature flags, rollback
- Product collaboration: scoping MVPs, iterating from user feedback

## Interview themes

Common formats combine a small full-stack exercise, discussion of a feature you owned across layers, and debugging a bug that crossed frontend/backend. Startups and scale-ups especially value speed with maintainability; enterprises add security and compliance expectations.

## Question bank

**Technical:** Feature delivered across UI, API, and DB—hard tradeoffs? Keeping API contracts stable while UI iterates. Bug spanning layers—debug process. Auth, validation, error states for new workflow.

**System design:** Build a todo app with sharing, admin dashboard with CRUD, or booking flow—include DB schema and UI states.

**Behavioral:** Scope cut when deadline slipped. Teaching backend patterns to frontend teammates or vice versa. Production issue you traced across stack.

## Strong answer framework

Map the user journey first, then data model, API endpoints, and UI states together. When discussing tradeoffs, name what you simplified for MVP and what technical debt you tracked. Include monitoring on both client errors and server errors after launch.

## Strong answer signals

- Same validation rules enforced server-side and client-side with shared schema where possible
- Describes feature flags or phased rollout spanning frontend and backend
- Debug story includes network tab, server logs, and database query
- Mentions E2E test covering critical path
- Personal ownership clear—not "frontend team did UI"

Example strong fragment: "Checkout failed silently because the API returned 422 with a field map but the UI only handled 400. I aligned the error contract, added shared Zod schema, and an E2E test. Support tickets for checkout dropped 40% week-over-week."

## Weak answer signals and red flags

- Siloed answers: only frontend or only backend depth
- No error/loading/empty state discussion
- API designed without considering mobile or web consumers
- Cannot explain database implications of a UI feature
- No testing or monitoring after shipping

## Common interviewer follow-ups

- Where do you validate—client, server, or both?
- How do you handle auth token refresh in SPA?
- What indexes does this UI query need?
- How would you split this into microservices later?
- What would you monitor on day one after launch?

## Seniority signals

**Junior:** Builds features with guidance on both sides. **Mid:** Owns vertical slices independently. **Senior:** Defines stack conventions, unblocks teams on integration, designs scalable boundaries.

## Coaching tips

Draw one diagram linking UI → API → DB for your flagship story. Emphasize measurable user impact. Full stack at Turkish startups (Getir, Trendyol) often means fast iteration under traffic spikes—mention peak readiness if relevant.
## Example answer snippets

**Weak:** "I did both frontend and backend for the feature."
**Strong:** "I shipped subscription billing end-to-end: Stripe webhook handler with idempotent event table, API contract documented in OpenAPI, and UI for failed payment recovery. E2E test covered happy path and card decline; involuntary churn dropped 9% in first month."

## Local market context

Full stack at Turkish scale-ups often means owning a vertical slice under deadline. Discuss API stability for mobile clients, feature flags, and coordinating with backend peak capacity during campaigns.
## Deep-dive topic bank

Cover: OpenAPI/tRPC contracts; shared Zod/Pydantic validation; session vs JWT; optimistic UI rollback; websocket vs polling; upload security; job status in UI; feature flags; transaction boundaries; correlation IDs.
