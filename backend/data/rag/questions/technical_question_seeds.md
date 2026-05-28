---
doc_type: question_seed
focus_area: Technical
difficulty: Mixed
---

# Technical Interview Question Seeds

Backend and APIs:
- Design paginated list APIs with filtering, sorting, and stable cursors.
- How would you handle idempotency for payment or order creation endpoints?
- Explain cache invalidation strategies and when each fails.
- Describe database indexing choices for a high-read dashboard query.

Frontend and product engineering:
- How do you diagnose and fix a performance regression in a React application?
- Explain accessibility checks you would run before shipping a form workflow.
- How would you structure state for a multi-step checkout with retries?

Reliability and operations:
- Walk through debugging a sudden spike in 500 errors after a deployment.
- How would you design retries, timeouts, and circuit breakers for a downstream dependency?
- What alerts would you create for a queue consumer falling behind?

Data and ML:
- How do you prevent data leakage in a model training pipeline?
- Explain offline vs online metric mismatch and how you would investigate it.
- How would you evaluate a RAG system beyond "it looks fine"?

Security basics:
- What are common API authentication mistakes and how do you avoid them?
- How would you store secrets and rotate credentials safely?

Distributed systems:
- Explain exactly-once vs at-least-once delivery and where each applies.
- How do you choose between sync RPC, message queue, and event log?
- Design conflict resolution for eventually consistent data.
- What is thundering herd and how do you mitigate it at cache and DB layers?

Sector-specific extensions:
- Fintech: technical_fintech_seeds.md
- Gaming: technical_gaming_seeds.md
- Aviation: technical_aviation_seeds.md
- Defense & aerospace: technical_defense_aerospace_seeds.md
- Telecom: technical_telecom_seeds.md
- E-commerce: technical_ecommerce_seeds.md
- Quick commerce: technical_quick_commerce_seeds.md

Adaptive prompts:
- If CV mentions Redis, ask about cache consistency or eviction under load.
- If memory shows weak validation, ask how tests and monitoring would catch regressions.
