---
doc_type: anti_pattern
focus_area: Technical
---

# Technical Interview Anti-Patterns

Tool-first answers:
- Listing technologies before clarifying requirements or constraints
- Naming microservices, Kafka, or Kubernetes without explaining why they fit

Missing validation:
- No tests, monitoring, rollout plan, or rollback strategy
- Claiming correctness without explaining how it was verified

Shallow debugging stories:
- "We restarted the service" with no root cause or prevention
- No mention of logs, metrics, traces, or hypothesis-driven investigation

Architecture buzzwords:
- "Event-driven", " scalable ", "cloud-native" without data volume, latency, or failure assumptions
- Ignoring consistency, idempotency, or backpressure in distributed designs

Security and reliability gaps:
- Storing secrets in code, skipping auth on internal endpoints, or ignoring rate limits
- No discussion of timeouts, retries, or poison-message handling in async systems

Data and ML anti-patterns:
- Training on future information, tuning on test data, or skipping baselines
- Launching models without drift monitoring or fallback behavior

Coaching conversions:
- Start with constraints and success metrics
- Explain one alternative and why it was rejected
- Close with validation: tests, dashboards, alerts, or user impact measurement
