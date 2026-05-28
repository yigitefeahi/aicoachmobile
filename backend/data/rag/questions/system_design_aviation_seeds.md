---
doc_type: question_seed
focus_area: SystemDesign
sector: aviation
difficulty: Senior
---

# System Design Seeds — Aviation & Travel

## Core prompts

- Design flight search system integrating GDS/PSS with caching and freshness SLAs.
- Design seat inventory hold and confirm flow preventing oversell.
- Design booking pipeline: search → hold → pay → ticket issue with failure recovery.
- Design IRROPS rebooking assistant notifying and rebooking affected passengers.
- Design check-in and boarding pass service with offline airport kiosk fallback.
- Design fare promotion engine for campaign peaks without overloading inventory systems.

## Requirements to clarify first

- Peak search QPS vs booking TPS; read-heavy search pattern.
- Inventory authority: who owns seat count—cache or source system?
- Hold duration, extension rules, and payment timeout interaction.
- International: currency, tax, document requirements.
- Downtime cost: passenger impact vs revenue during disruption.

## Architecture probes

- Cache invalidation when PSS inventory changes; stale fare handling.
- Idempotent booking confirm; handling payment success + ticket issue failure.
- Queue-based decoupling from legacy PSS latency spikes.
- Multi-step saga: compensate hold release if payment fails.
- Read replicas vs materialized search index; hot route sharding.

## Failure and edge cases

- Double booking on concurrent hold for last seat.
- Payment captured but ticket not issued—reconciliation and customer comms.
- Search available but booking fails—UX and ops playbook.
- Campaign traffic 5x—what degrades gracefully (cached routes only)?
- Third-party PSS outage—read-only mode vs full booking stop.

## Observability and rollout

- Metrics: search p95, booking conversion, hold expiry rate, payment success, oversell count.
- Game-day load test before peak season; autoscale limits protecting DB.
- Feature flags for new payment method or route bundle.
- Status comms integration for mass delay scenarios.

## Evaluation rubric

Strong candidates quantify passenger impact, peak readiness, inventory correctness, and ops coordination—not generic microservices diagram.
