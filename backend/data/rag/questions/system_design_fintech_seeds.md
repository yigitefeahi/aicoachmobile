---
doc_type: question_seed
focus_area: SystemDesign
sector: fintech
difficulty: Senior
---

# System Design Seeds — Fintech & Banking

## Core prompts

- Design a mobile wallet with top-up, P2P transfer, and transaction history.
- Design a payment gateway integration layer with idempotency and reconciliation.
- Design fraud detection pipeline for real-time transaction scoring.
- Design ledger system supporting holds, captures, refunds, and partial refunds.
- Design KYC document upload and verification workflow with audit trail.
- Design notification system for payment success, failure, and suspicious activity.

## Requirements to clarify first

- Money correctness vs availability—what level of consistency is mandatory?
- Regulatory retention: how long are logs and ledger entries kept?
- Peak TPS during campaigns; read vs write ratio on transaction history.
- Multi-currency, multi-tenant, or single market scope.
- Offline/mobile retry behavior and duplicate submission tolerance.

## Architecture probes

- Where is source of truth: ledger DB, event log, or both?
- How do outbox pattern and saga apply to transfer to external bank?
- Idempotency key storage, TTL, and collision handling.
- Reconciliation batch vs streaming; handling mismatches.
- Secrets, HSM, tokenization for card data (PCI scope reduction).

## Failure and edge cases

- Gateway timeout with unknown payment state—pending workflow design.
- Duplicate webhook delivery from provider.
- Partial outage: can users view balance if top-up is down?
- Fraud rule false positives blocking legitimate campaign traffic.
- Schema migration on ledger without locking entire table.

## Observability and rollout

- Metrics: payment success rate, duplicate rate, pending age, reconciliation variance.
- Alerts on reconciliation drift, fraud queue depth, 3DS failure spike.
- Staged rollout by user segment; kill switch for new payment method.
- Audit log immutability and admin action tracing.

## Evaluation rubric

Strong candidates define invariants (no double spend), explicit consistency model, reconciliation path, and compliance-aware logging before drawing microservices.
