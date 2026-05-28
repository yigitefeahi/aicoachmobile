---
doc_type: story
focus_area: Technical
---

# Strong vs Weak Technical Answer Examples

## API design

Weak:
"I would use Node.js and MongoDB and make it scalable with microservices."

Strong:
"Requirements: 10k writes/min, idempotent order creation, and readable audit logs. I would use a relational core for orders, expose POST /orders with Idempotency-Key, validate input at the edge, and return 409 on duplicate keys. Reads can hit a read replica with cursor pagination. I would load-test 2x peak and alert on error rate and p95 latency."

## Production incident

Weak:
"The server crashed so we restarted it and it was fine."

Strong:
"Alerts showed queue lag and DB connection pool exhaustion. I traced it to a deploy that removed a query limit on a batch job. Mitigation: scaled workers temporarily and rolled back the deploy. Fix: restored pagination, added a pool usage dashboard, and capped job batch size. Incidents of this class dropped to zero the next month."

## System design summary

Weak:
"I would use Redis, Kafka, and load balancers."

Strong:
"For a notification service, I would separate ingestion, scheduling, and delivery workers. Push provider failures go to a retry queue with exponential backoff and dead-letter review. Idempotency keys prevent duplicate sends. We measure delivery latency, retry rate, and provider error codes, with per-tenant rate limits for abuse protection."

Evaluator note: reward constraints, tradeoffs, validation, and operational thinking.

## Database migration (zero-downtime)

Weak:
"I ran ALTER TABLE at night when traffic was low."

Strong:
"Adding non-null column to 80M row orders table: expand phase added nullable column, backfill job in batches of 10K with rate limit, dual-write in app, verify counts, then enforce NOT NULL via check constraint, then contract old path. Zero user-facing downtime; backfill completed in 6 hours under 15% replica lag cap."

## RAG / AI feature (AI engineer overlap)

Weak:
"We embedded documents and connected ChatGPT."

Strong:
"Coach answers needed grounding in role rubrics. I chunked at 700 tokens with overlap, tagged metadata by company and doc_type, hybrid retrieval with graph expansion, and golden-set Hit@3 eval before prompt changes ship. User thumbs-down on wrong company advice dropped 29% after metadata filter on company pack."

Sector-specific examples: see strong_weak_fintech_banking_examples.md, strong_weak_gaming_examples.md, strong_weak_aviation_examples.md, strong_weak_defense_aerospace_examples.md, strong_weak_telecom_examples.md, strong_weak_ecommerce_examples.md, strong_weak_quick_commerce_examples.md.
