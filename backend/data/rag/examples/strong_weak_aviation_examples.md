---
doc_type: story
focus_area: Mixed
sector: aviation
---

# Strong vs Weak Examples — Aviation & Travel Tech

## Peak booking traffic (technical)

**Weak:**
"We scaled servers before holiday season."

**Strong:**
"Bayram campaign expected 4x search traffic vs baseline. I load-tested search API at 5x, pre-warmed CDN for static routes, enabled read replica for fare cache, and set autoscale on queue workers with max cap to protect DB. Game day: p95 search 420ms vs 380ms target, zero booking downtime, conversion held at 2.1% vs 2.0% prior year."

## Booking payment failure (behavioral)

**Weak:**
"Payments failed sometimes; we fixed the bug."

**Strong:**
"Situation: 3DS redirect failures spiked on mobile web during check-in window. Task: I owned cross-team bridge between payments and mobile web. Action: traced iframe timeout on older WebViews, added fallback deep link flow, and coordinated comms template for affected passengers. Result: payment success +11%, call center volume -18% over peak weekend."

## Inventory consistency (technical)

**Weak:**
"We use a database for seat inventory."

**Strong:**
"Seat holds must expire consistently across search, hold, and payment. I implemented hold TTL in Redis with atomic decrement on confirm, reconciliation job against PSS feed every 2 minutes, and idempotent confirm handler. Oversell incidents went from 3/month to zero over two quarters; support compensation cost dropped measurably."

## Operational disruption (behavioral)

**Weak:**
"When flights delay, the app shows updated info."

**Strong:**
"During IRROPS storm, push notification storm risked overwhelming app. I proposed batched notifications by route priority, added 'my trips only' filter default, and status page integration for airport-wide delays. Passenger self-serve rebooking completion +22%, support chat queue peak -30% vs prior disruption event."

## Cost-aware engineering (technical)

**Weak:**
"We moved everything to cloud for reliability."

**Strong:**
"Fare cache on always-on Redis cluster cost €18K/month with 40% idle overnight. I shifted warm cache to autoscaling memory store, cold routes to computed-on-miss with 5-minute TTL, and tagged resources by route group. Cost -35% with p95 cache miss latency within SLA for top 200 routes."

Evaluator note: aviation strong answers mention passengers, peak travel, payment/check-in reliability, ops coordination, and cost—not generic CRUD.
