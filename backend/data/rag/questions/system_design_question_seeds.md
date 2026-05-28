---
doc_type: question_seed
focus_area: SystemDesign
difficulty: Senior
---

# System Design Interview Question Seeds

Core prompts:
- Design a URL shortener with analytics and abuse protection.
- Design a rate limiter for a public API used by many tenants.
- Design a notification system supporting email, push, and SMS with retries.
- Design a news feed or timeline service for millions of users.
- Design a file upload and sharing service with access control.
- Design a distributed cache with consistent invalidation across regions.
- Design an e-commerce checkout service with inventory reservation.
- Design a chat/messaging system with read receipts and presence.
- Design a job scheduler that runs millions of daily tasks reliably.
- Design a metrics and alerting platform (time-series ingestion + query).

Domain-specific extensions:
- Fintech: system_design_fintech_seeds.md
- Gaming: system_design_gaming_seeds.md
- Aviation: system_design_aviation_seeds.md
- Defense & aerospace: system_design_defense_aerospace_seeds.md
- Telecom: system_design_telecom_seeds.md
- E-commerce marketplace: system_design_ecommerce_seeds.md
- Quick commerce: system_design_quick_commerce_seeds.md

Follow-up probes:
- What are the read/write ratio assumptions and how do they change the design?
- Where are the single points of failure and how are they mitigated?
- How do you handle hot keys, fanout, or thundering herd problems?
- What data model and indexing strategy would you use?
- How would you roll out the design safely and monitor it in production?

Evaluation focus:
- Clarifies functional and non-functional requirements before drawing boxes
- Compares at least two architectures and explains the decision
- Discusses consistency, availability, latency, and cost tradeoffs explicitly
- Includes observability, failure recovery, and scaling path

Junior vs senior adaptation:
- Junior: emphasize components, basic scaling, and validation
- Senior: emphasize tradeoffs, migration, org constraints, and operational maturity
