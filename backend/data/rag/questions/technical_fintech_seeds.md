---
doc_type: question_seed
focus_area: Technical
sector: fintech
difficulty: Mixed
---

# Technical Interview Seeds — Fintech & Banking

## API and data integrity

- Implement idempotent POST for money transfer—DB schema and status machine.
- Design double-entry ledger entries for charge, refund, and fee.
- Explain optimistic locking vs pessimistic locking for balance updates.
- How do you prevent race condition on concurrent withdrawals from same wallet?
- Pagination and audit export for regulators—performance considerations.

## Security

- Store refresh tokens safely on mobile; rotation on reuse detection.
- Map OWASP API risks to wallet endpoints (BOLA, mass assignment, rate limit).
- PII minimization in logs and support tooling.
- Step-up authentication triggers for high-risk transactions.

## Integration and ops

- Webhook signature verification and replay attack prevention.
- Reconciliation job design: matching, tolerance, escalation queue.
- Circuit breaker on external bank adapter—what fails open vs closed?
- Feature flag for new payment provider with per-tenant canary.

## Debugging scenarios

- Duplicate charges reported—investigation checklist.
- Pending transactions stuck 24h—root cause categories.
- Fraud false positives during campaign—tuning without blind spots.
- Ledger sum mismatch 0.01 currency unit—rounding and reconciliation.

## Coding-style prompts

- Write pseudocode for idempotency middleware.
- SQL query: find accounts with negative available balance anomaly.
- Design enum states for payment intent: created, processing, succeeded, failed, disputed.

## Strong answer signals

Mentions reconciliation, audit trail, invariants, staged rollout, and customer-visible metrics—not only CRUD endpoints.

## Weak answer signals

"Use blockchain" or microservices without consistency model; no fraud or duplicate handling; ignores compliance logging.
