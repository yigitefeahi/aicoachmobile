---
doc_type: role
profession: backend_developer
focus_area: Mixed
---

# Backend Developer — Interview Coaching Knowledge Base

## Role overview

Backend developer interviews test whether you can design reliable services, model data correctly, handle failure, and ship APIs that other teams can depend on. Interviewers care about boundaries: what lives in the API layer, what belongs in the database, what should be async, and how you observe production behavior. Strong candidates explain tradeoffs with numbers or concrete incidents, not only technology names.

## Core competencies

- REST or RPC API design: validation, versioning, pagination, idempotency, error contracts
- Data modeling: normalization vs denormalization, indexes, transactions, migrations
- Performance: caching, connection pooling, N+1 queries, read/write patterns
- Reliability: retries, timeouts, circuit breakers, graceful degradation, backpressure
- Security: authentication, authorization, input validation, secrets, rate limiting
- Observability: structured logs, metrics, traces, SLO-aware alerting

## Interview themes

Technical depth usually appears in API design, database reasoning, debugging production incidents, and medium-scale system design (notification service, rate limiter, checkout flow). Behavioral loops probe ownership during outages, cross-team API contracts, and how you balance speed with correctness—especially in regulated or high-traffic domains.

## Question bank

**Technical:** Walk through an API you built and the tradeoffs you made. How do you design pagination, filtering, and sorting? When does indexing help or hurt? How do you prevent duplicate writes in payment-like flows?

**System design:** Design a URL shortener, notification service, or order processing pipeline. How would you scale read-heavy vs write-heavy endpoints? Where do you use cache vs database vs queue?

**Behavioral:** Describe a production incident you debugged. Tell me about a time an API change broke a consumer. How did you negotiate an API contract with frontend or mobile teams?

**Debugging:** High latency on one endpoint—how do you investigate? Intermittent 500 errors under load—what do you check first?

## Strong answer framework

Open with context and constraints (traffic, consistency needs, team size). State your design or action, explain alternatives you rejected, and close with measurable outcome: latency p95, error rate, incident duration, or deployment frequency. For incidents use STAR but always include detection signal, root cause, permanent fix, and prevention.

## Strong answer signals

- Mentions idempotency keys, outbox pattern, or saga when discussing distributed workflows
- Explains index choice with query patterns, not generic "indexes are good"
- Describes observability added after an incident: dashboards, alerts, runbooks
- Shows personal contribution in schema design, API review, or on-call fix
- Discusses backward-compatible API evolution and deprecation strategy

Example strong fragment: "We added a composite index on (tenant_id, created_at) because list queries filtered by tenant and sorted by date. That cut p95 from 800ms to 90ms. We also added a slow-query alert because the previous fix hid a missing tenant filter in one admin endpoint."

## Weak answer signals and red flags

- Lists frameworks without explaining failure modes or data consistency
- No mention of validation, auth, or error handling for user-facing APIs
- Describes team architecture with no personal decision or debugging step
- Treats caching as always beneficial without invalidation or stampede risk
- Cannot explain a production issue beyond "we restarted the service"

## Common interviewer follow-ups

- What happens if the cache is down?
- How do you migrate schema without downtime?
- How would you detect a memory leak or connection pool exhaustion?
- What status codes and error body shape do clients need?
- How do you test integration with external payment or auth providers?

## Seniority signals

**Junior:** Implements endpoints with guidance; understands CRUD, basic SQL, and unit tests. **Mid:** Owns services end-to-end, designs indexes and caching, handles on-call tickets with runbooks. **Senior:** Sets API standards, leads incident reviews, designs multi-service workflows, mentors on reliability and security.

## Coaching tips

Lead with correctness and observability for fintech, e-commerce checkout, or telecom-scale traffic. Use one concrete metric per story. When stuck on system design, clarify read/write ratio, consistency requirements, and failure domains before drawing boxes.
## Example answer snippets

**Weak:** "I built a REST API with FastAPI and PostgreSQL. It worked well and the team liked it."
**Strong:** "I owned the order API used by mobile and web. We added idempotency keys on POST /orders because retries caused duplicates during peak sale—duplicate orders dropped from 0.8% to near zero. I indexed (user_id, created_at) for order history and added p95 latency dashboard with alert at 300ms."

## Local market context

Turkish fintech and bank tech (Garanti, Akbank, Papara) expect discussion of KVKK sensitivity, audit trails, and money correctness. E-commerce backends (Trendyol, Hepsiburada) care about campaign peak traffic, checkout reliability, and inventory consistency. Mention staged rollout and reconciliation when discussing payments.
## Deep-dive topic bank

Prepare concise explanations for: ACID vs BASE tradeoffs; optimistic vs pessimistic locking; cache invalidation (TTL, write-through, event-driven); rate limiting (token bucket, sliding window); JWT vs session auth; expand/contract migrations; queue ordering guarantees; health checks for orchestrators; structured logging fields; load-testing before campaigns.
