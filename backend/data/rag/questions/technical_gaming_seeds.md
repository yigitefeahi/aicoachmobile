---
doc_type: question_seed
focus_area: Technical
sector: gaming
difficulty: Mixed
---

# Technical Interview Seeds — Mobile Gaming

## Client performance

- Profile and fix main-thread blocking during level load.
- Memory budget for texture atlases on 3GB RAM Android devices.
- Object pooling for bullets/particles—when worth it vs premature optimization.
- Battery impact of 60fps vs 30fps for puzzle game—tradeoffs.

## Game systems

- Server-side validation of puzzle move sequence anti-cheat.
- Seeded RNG fairness—client display vs server authority.
- Progression curve tuning—data pipeline from analytics to design tools.
- Save game cloud sync with conflict resolution across devices.

## Live ops engineering

- Remote config JSON schema versioning and backward compatibility.
- Hotfix pipeline for critical crash without full store review delay.
- A/B assignment sticky per user; avoiding cohort pollution.
- Event schedule timezone bugs—how to test.

## Backend and data

- Ingest client events with batching, compression, dedupe keys.
- Leaderboard top-K query at scale—Redis sorted set vs DB.
- IAP receipt validation flow with Apple/Google server APIs.
- Detect abnormal currency gain—rule engine vs ML anomaly.

## Debugging scenarios

- Crash only on specific GPU—investigation steps.
- Live event participation metric half expected—SDK or server bug?
- Memory leak over 30-minute session—tools and fixes.
- Cheater tops leaderboard—validation and rollback.

## Strong answer signals

Cites crash-free rate, retention, device tier, live rollback, and personal profiling/debug story.

## Weak answer signals

Only Unity/Unreal buzzwords; no metrics; ignores low-end devices or store release constraints.
