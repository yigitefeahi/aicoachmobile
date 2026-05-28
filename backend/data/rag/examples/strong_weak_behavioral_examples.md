---
doc_type: story
focus_area: Behavioral
---

# Strong vs Weak Behavioral Answer Examples

## Conflict with a teammate

Weak:
"We had a disagreement on the team about the design. Eventually leadership decided and we moved on."

Strong:
"Situation: Our checkout API latency increased after a refactor. Task: I owned the rollback decision while keeping the release train moving. Action: I mapped p95 latency by endpoint, proposed reverting only the caching layer, and paired with the other engineer to reproduce the bug in staging. We presented two options to the PM with customer impact estimates. Result: p95 dropped from 820ms to 210ms within a day, and we added a load test that now runs in CI."

## Project ownership

Weak:
"I worked on an important feature with the team and users liked it."

Strong:
"I led migration of billing webhooks to idempotent handlers. I wrote the design doc, added deduplication keys, and coordinated with finance on reconciliation. After launch, duplicate charges dropped to zero and support tickets for double billing fell 34% over two weeks."

## Failure and learning

Weak:
"I once shipped a bug, but I learned to be more careful."

Strong:
"I deployed a config change that disabled rate limiting for one tenant tier. I detected the spike in 500s via alert, rolled back in 12 minutes, and added a canary tenant plus a config validation check. The postmortem led to mandatory staged rollout for auth-related flags."

Evaluator note: strong examples include personal verbs, numbers, timeframe, and prevention steps.

## Cross-functional delivery (fintech-adjacent)

Weak:
"Product wanted the feature fast so we skipped some tests."

Strong:
"Situation: Loan approval UI needed KYC provider switch before regulatory date. Task: I owned technical cutover plan. Action: parallel run old/new provider in shadow mode for one week, compared decision match rate (97.2%), defined rollback if mismatch >2%, and trained support on new error codes. Result: on-time launch, mismatch stayed below threshold, support escalations flat week-one."

## On-call under pressure (aviation-adjacent)

Weak:
"I fixed the server during the incident."

Strong:
"During peak check-in, search errors rose to 8%. I declared incident, routed read traffic to stale-but-valid cache tier with banner, disabled non-critical fare promo API, and paired with ops on passenger comms template. MTTR 47 minutes; conversion recovered to baseline within 2 hours; postmortem added automatic cache tier fallback."

Sector-specific examples: see strong_weak_fintech_banking_examples.md, strong_weak_gaming_examples.md, strong_weak_aviation_examples.md, strong_weak_defense_aerospace_examples.md, strong_weak_telecom_examples.md, strong_weak_ecommerce_examples.md, strong_weak_quick_commerce_examples.md.
