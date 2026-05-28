---
doc_type: question_seed
focus_area: SystemDesign
sector: gaming
difficulty: Senior
---

# System Design Seeds — Mobile Gaming

## Core prompts

- Design global leaderboard for async puzzle game with cheat resistance.
- Design live ops config system pushing events, bundles, and balance to clients.
- Design matchmaking for casual 1v1 mode with latency constraints.
- Design analytics pipeline for billions of client events with offline players.
- Design in-app purchase validation and receipt anti-fraud flow.
- Design content delivery for level packs with delta updates and rollback.

## Requirements to clarify first

- Real-time vs turn-based; sync vs async gameplay.
- Device tiers and acceptable crash-free / frame rate targets.
- Live event frequency and rollback time requirement.
- Global vs regional rollout; store policy constraints (Apple/Google).
- Economy sensitivity: can config changes be instant or require maintenance window?

## Architecture probes

- Client authoritative vs server authoritative for scores and moves.
- Anti-cheat: replay validation, server-side seed verification, rate limits.
- Remote config versioning, cohort targeting, and fallback defaults.
- CDN vs in-app bundle strategy; A/B asset delivery.
- Event ingestion: batch on device, compress, dedupe, idempotent server ingest.

## Failure and edge cases

- Bad content bundle shipped—disable via remote flag without app update.
- Leaderboard exploit via clock manipulation or packet replay.
- IAP receipt replay across accounts.
- Live event overload crashing matchmaking service.
- Analytics loss during offline play—replay buffer limits.

## Observability and rollout

- Metrics: crash-free sessions, D1/D7, event participation, IAP validation failures.
- Canary region or % player cohort before global live ops.
- Dashboards for economy sinks/sources after balance patch.
- Rollback playbook for config and content in under X minutes.

## Evaluation rubric

Strong answers connect design to player experience metrics, live ops safety, and low-end device constraints—not only backend scale.
