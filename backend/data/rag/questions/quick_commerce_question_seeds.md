---
doc_type: question_seed
focus_area: Mixed
sector: quick_commerce
difficulty: Mixed
---

# Quick Commerce Interview Question Seeds

## Getir — delivery and operations

- Improve dispatch, routing, or courier utilization under 10–30 minute delivery windows.
- Incident during peak demand (weather, holiday)—mitigation and long-term fix.
- Design real-time order tracking UX that reduces support contacts.
- Handle store-level inventory drift causing cancellations.

## Dispatch and routing

- Batch orders vs solo dispatch—how do you tune thresholds dynamically?
- Geo heatmap demand prediction for courier pre-positioning.
- Partner fleet overflow integration when internal capacity saturated.

## Store and picker ops

- Picker app workflow: substitutions, out-of-stock, SLA to courier handoff.
- Dark store vs partner store inventory model differences.
- Version conflict when POS and app both update stock.

## Behavioral

- SLA miss spike—ops bridge role and metrics recovered.
- Product wanted wider delivery radius—engineering pushback with data.
- Launch in new city—what broke and playbook added.

## Technical probes

- ETA prediction inputs and failure when GPS noisy.
- Queue depth alerts triggering zone throttle or surge pause.
- Payment capture timing vs picker start—race conditions.
- Push notification storms during delay—batching strategy.

## Adaptive follow-ups

- Average delivery time, cancellation %, courier utilization, ticket volume?
- Zone-level vs city-level rollout?
- Personal ownership in algo vs infra vs mobile?

Company rubric: getir. Examples: strong_weak_quick_commerce_examples.md.
