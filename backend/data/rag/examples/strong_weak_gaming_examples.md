---
doc_type: story
focus_area: Mixed
sector: gaming
---

# Strong vs Weak Examples — Mobile Gaming

## Performance optimization (technical)

**Weak:**
"I optimized the game and FPS improved."

**Strong:**
"Level load stutter on Android mid-tier devices caused 12% session drop at first puzzle. Profiler showed synchronous asset decode on main thread. I moved decode to background job, added progressive loading with placeholder art, and capped texture atlas size per device tier. Cold start -1.8s, D1 retention +4.2 points on affected cohort, crash-free sessions 99.1% → 99.5%."

## Live ops event (behavioral)

**Weak:**
"We shipped a live event and players enjoyed it."

**Strong:**
"Situation: Weekend tournament launch overlapped with server maintenance window. Task: I owned client hotfix path for event config mismatch. Action: shipped remote config fallback, added server-side feature flag for event assets, and ran 1% canary on TR region first. Result: participation target hit 112%, crash rate flat, rollback script unused but tested in staging."

## A/B experiment (technical + product)

**Weak:**
"We A/B tested two UI versions and picked the winner."

**Strong:**
"Hypothesis: shorter tutorial increases D3 retention without hurting payer conversion. Guardrails: ARPDAU, crash rate, tutorial completion time. Ran 14-day test with 500K MAU split; variant B +3.1% D3 but -1.8% first purchase. We shipped hybrid: shorter tutorial + one optional mechanic explainer. D3 +2.4%, first purchase flat vs control."

## Multiplayer sync (technical)

**Weak:**
"I used WebSockets for real-time multiplayer."

**Strong:**
"Turn-based puzzle league needed <500ms move confirmation on 3G. I used authoritative server with client prediction for UI only, sequence numbers for move ordering, and reconnect buffer replaying last 10 moves. Cheating attempts via out-of-order packets rejected. Desync tickets dropped from ~40/week to 2/week."

## Live incident (behavioral)

**Weak:**
"There was a bug after update; we fixed it quickly."

**Strong:**
"Crash spike to 8% crash-free on iOS 17.1 after asset bundle update. I correlated with Firebase, identified missing fallback for corrupted bundle CRC, shipped emergency config to disable new bundle, and added CI checksum gate. MTTR 3.5 hours; repeat class prevented by automated bundle validation in pipeline."

Evaluator note: gaming strong answers tie engineering to retention, crash-free rate, live ops safety, and player-visible metrics.
