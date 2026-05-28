---
doc_type: story
focus_area: Mixed
sector: telecom
---

# Strong vs Weak Examples — Telecom & Network Services

## Peak event availability (technical)

**Weak:**
"We scaled servers before New Year's Eve."

**Strong:**
"Turkcell-scale NYE traffic: prepaid top-up and SMS verification 6x baseline. I pre-warmed auth service pools, enabled circuit breaker on non-critical personalization API, and shifted read-heavy profile lookups to cache with 30s TTL. Game day p95 auth 180ms vs 200ms SLO, error rate 0.04%, zero Sev-1; post-event we kept cache tier for daily peak hours saving 12% compute."

## Churn reduction experiment (behavioral)

**Weak:**
"We improved the app and churn went down."

**Strong:**
"Situation: Postpaid churn rose in one region. Task: I owned analysis linking churn to bill shock events. Action: built cohort view in warehouse, found 23% churned within 7 days of data overage SMS without upsell path; partnered with product on in-app data pack offer at trigger moment. Result: regional churn -8% over 8 weeks, upsell conversion +5.2%, no increase in support contacts."

## Network modernization (technical)

**Weak:**
"We migrated to cloud for the billing system."

**Strong:**
"Türk Telekom-style legacy billing adjacency: strangled read-only customer usage API first—sync batch every 15 min with reconciliation alert on row count drift >0.1%. Dual-write phase for profile updates over 6 weeks with shadow compare. Cutover weekend had rollback switch tested twice; zero data mismatch in reconciliation; customer-facing outage window 0 minutes (read path only)."

## Incident during transformation (behavioral)

**Weak:**
"There was an outage; we restored service quickly."

**Strong:**
"Provisioning API errors spiked after middleware upgrade affecting 40K activations/day. I led bridge call, rolled back canary region in 22 minutes, identified schema default mismatch, added contract test in CI against golden OpenAPI. Repeat incidents zero over 90 days; change board now requires contract test green for API consumer teams."

## Latency optimization (technical)

**Weak:**
"I added Redis and it got faster."

**Strong:**
"Self-service portal dashboard p95 2.1s unacceptable for retail stores. Traced N+1 service calls across four internal APIs; introduced BFF aggregating parallel fetches with 300ms timeout budget per dependency and partial degrade for non-critical widgets. p95 620ms; timeout errors surfaced per widget instead of full page fail."

Evaluator note: telecom strong answers cite availability during peaks, subscriber metrics, migration risk control, and enterprise-scale rollout discipline.
