---
doc_type: question_seed
focus_area: SystemDesign
sector: defense
difficulty: Senior
---

# System Design Seeds — Defense & Aerospace

## Core prompts

- Design command-and-control data ingest from field units with intermittent connectivity.
- Design test bench automation system recording traceable results for certification.
- Design secure software update pipeline for embedded devices in field.
- Design multi-level security document management with audit trail.
- Design simulation environment feeding hardware-in-the-loop tests at scale.
- Design integration bus connecting legacy subsystems to modern analytics.

## Requirements to clarify

- Safety or mission criticality class—what failure modes are unacceptable?
- Certification evidence: traceability, change control, retention period.
- Real-time latency bounds vs batch reconciliation acceptable delay.
- Air-gapped or restricted network constraints.
- Supplier/external interface ownership and SLAs.

## Architecture probes

- Message integrity: sequencing, signing, replay protection.
- Redundancy: active-passive vs active-active for critical paths.
- Deterministic behavior on embedded targets vs cloud analytics split.
- Configuration management: signed builds, approved baselines only in prod.
- Verification hooks: automated regression tied to requirement IDs.

## Failure and edge cases

- Link loss mid-transmission—store-and-forward design.
- Partial subsystem upgrade incompatible with field hardware revision.
- Test environment drift from production configuration.
- Insider threat on admin access to deployment keys.

## Observability and process

- Metrics: defect escape rate, test pass rate, soak duration, MTTR on field issues.
- Immutable audit logs for config and release actions.
- Formal release gate checklist—not only technical monitoring.

## Evaluation rubric

Strong candidates prioritize verification, traceability, and explicit risk acceptance over feature velocity.
