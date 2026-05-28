---
doc_type: story
focus_area: Mixed
sector: ecommerce
---

# Strong vs Weak Examples — E-Commerce & Marketplace

## Campaign peak (technical)

**Weak:**
"We added more servers for Black Friday."

**Strong:**
"11.11 sale load test at 6x normal checkout TPS exposed cart service lock contention. I sharded cart by user_id, moved flash sale inventory to Redis with Lua atomic decrement, and enabled queue-based order creation with backpressure. Peak day: checkout error rate 0.08%, p95 checkout 1.2s, zero oversell on top 500 SKUs."

## Duplicate orders (technical)

**Weak:**
"We check if order exists before creating."

**Strong:**
"Double-submit on mobile 'Buy Now' caused duplicate orders during payment redirect. Fix: Idempotency-Key from client session, unique constraint on (user_id, client_request_id), and UI debounce on pay button until 409 or 201 returned. Duplicate order rate 0.9% → 0.02%; seller settlement disputes down 15%."

## Seller/buyer dispute (behavioral)

**Weak:**
"I worked with support to resolve customer issues."

**Strong:**
"Situation: Seller portal showed delivered but buyer claimed not received—metric trust score dropping. Task: I owned tracking integration audit. Action: mapped carrier webhook gaps, added SLA alert on missing scan events, and surfaced 'investigation required' state to support tooling. Result: dispute resolution time -26%, repeat dispute rate -12% in 6 weeks."

## Search relevance experiment (behavioral + technical)

**Weak:**
"We improved search and sales went up."

**Strong:**
"Search zero-result rate was 18% on long-tail queries. I added synonym dictionary for TR locale, fallback to category browse, and measured add-to-cart from search. A/B showed +6% search-attributed GMV; rolled out with guardrail on return rate unchanged."

Evaluator note: marketplace answers should cover buyers, sellers, inventory, campaigns, and measurable commerce metrics.
