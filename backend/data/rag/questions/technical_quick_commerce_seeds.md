---
doc_type: question_seed
focus_area: Technical
sector: quick_commerce
difficulty: Mixed
---

# Technical Interview Seeds — Quick Commerce

## Dispatch and routing

- Dynamic batching radius algorithm inputs (queue depth, ETA, courier count).
- Solo dispatch trigger when wait time exceeds threshold.
- Geo heatmap for pre-positioning couriers before dinner peak.

## Inventory and picking

- Versioned stock record conflict: POS vs picker app vs manual override.
- Substitution API contract for picker app and customer notification.
- Cancellation when item unavailable after pick started—state transitions.

## Tracking and ETA

- GPS smoothing and route snap-to-road for customer map.
- ETA model features and fallback when traffic data missing.
- Reduce 'where is my order' tickets via proactive delay notification.

## Peak and incidents

- Zone throttle when queue depth exceeds capacity model.
- Partner fleet API integration for overflow routing.
- Rain/event demand spike—ops playbook automation hooks.

## Debugging scenarios

- SLA miss rate 22% in one zone—metrics to inspect first.
- Cancellation rate 6% from inventory drift—root cause categories.
- Courier double-assigned bug—locking or idempotency fix.

## Strong answer signals

Delivery time, SLA miss %, utilization, cancellation rate, ticket volume—with personal fix story.

## Weak answer signals

Treats like standard e-commerce checkout only; ignores courier ops and zone dynamics.
