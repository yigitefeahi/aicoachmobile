---
doc_type: question_seed
focus_area: SystemDesign
sector: telecom
difficulty: Senior
---

# System Design Seeds — Telecom

## Core prompts

- Design prepaid top-up and balance query system for national peak events.
- Design subscriber authentication service with 99.99% availability target.
- Design self-service portal aggregating legacy BSS data and modern microservices.
- Design SMS OTP delivery with provider failover and abuse protection.
- Design real-time usage metering and fair-usage policy enforcement.
- Design gradual migration from monolithic billing read API to strangled microservice.

## Requirements to clarify

- Peak TPS for auth, top-up, provisioning vs steady state.
- Consistency: can balance display be eventually consistent?
- Regulatory retention and lawful intercept constraints (high level).
- Enterprise SLA vs consumer SLA differences.
- Geographic redundancy and disaster recovery RTO/RPO.

## Architecture probes

- BFF aggregation vs direct client-to-many-services.
- Cache layers for subscriber profile; invalidation on plan change.
- Circuit breakers isolating personalization from auth critical path.
- Queue-based provisioning with idempotent worker design.
- Dual-write vs event-driven sync during legacy migration.

## Failure and edge cases

- Partial BSS outage—degraded read-only mode messaging.
- OTP flood attack—rate limit per MSISDN, IP, device fingerprint.
- Campaign misconfiguration causing 10x traffic to wrong endpoint.
- Clock skew in usage metering windows.

## Observability and rollout

- Metrics: auth p95, top-up success, provisioning backlog, churn proxy signals.
- Game-day load test before NYE / major campaign.
- Feature flags for new digital product modules by region.
- Reconciliation jobs comparing digital channel vs BSS totals.

## Evaluation rubric

Strong answers separate critical subscriber paths from best-effort features and quantify peak readiness.
