---
doc_type: framework
focus_area: SystemDesign
---

# System Design Answer Framework

Step 1 — Clarify requirements:
- Functional: core user actions, actors, and data flows
- Non-functional: scale, latency, availability, consistency, security, cost
- Success metrics and out-of-scope items

Step 2 — Estimate scale:
- Daily/monthly active users, read/write ratio, payload sizes, peak multiplier
- Back-of-envelope storage and QPS to guide component choice

Step 3 — High-level design:
- Draw major services, data stores, queues, caches, and external dependencies
- Identify synchronous vs asynchronous boundaries

Step 4 — Deep dive on critical paths:
- Data model, indexing, hot keys, fanout, caching, sharding, or partitioning
- Failure modes: dependency outage, duplicate messages, partial writes

Step 5 — Tradeoffs and alternatives:
- Compare at least two options (e.g., push vs pull, SQL vs NoSQL, sync vs async)
- Explain why the chosen design fits the stated constraints

Step 6 — Operability:
- Monitoring, alerting, rollout, rollback, backfill, and capacity planning
- Security: authn/authz, secrets, tenant isolation, abuse protection

Strong closings include a phased rollout and what to measure in week one after launch.

Common mistakes: jumping to components before requirements, ignoring failure handling, and omitting observability.
