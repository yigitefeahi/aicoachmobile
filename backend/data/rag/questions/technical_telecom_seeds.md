---
doc_type: question_seed
focus_area: Technical
sector: telecom
difficulty: Mixed
---

# Technical Interview Seeds — Telecom

## Subscriber-facing APIs

- Design idempotent prepaid top-up callback handler.
- OTP generation, rate limit, and provider failover sequence.
- Subscriber profile read caching—TTL and invalidation on plan change.
- BFF parallel fetch with timeout budget and partial response.

## Legacy integration

- Strangler fig pattern for billing read API migration steps.
- Reconciliation job detecting drift between digital channel and BSS.
- Dual-write shadow compare before cutover checklist items.

## Reliability

- Circuit breaker when personalization service slow—fallback behavior.
- Load test script assumptions for 6x NYE auth traffic.
- Graceful degradation messaging when non-critical widgets fail.

## Data and analytics

- Cohort churn analysis SQL outline for regional bill shock.
- Real-time vs batch usage metering tradeoffs.
- Experiment guardrails on subscriber-facing price or plan tests.

## Debugging scenarios

- Auth errors spike after middleware upgrade—investigation order.
- Dashboard p95 latency 2s—N+1 across internal services fix.
- Provisioning backlog growing—queue consumer lag diagnosis.

## Strong answer signals

Peak event readiness, subscriber impact metrics, migration risk controls, SLO language.

## Weak answer signals

Generic CRUD API design ignoring BSS latency; no peak story; no rollback or reconciliation.
