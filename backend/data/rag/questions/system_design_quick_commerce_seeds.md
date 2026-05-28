---
doc_type: question_seed
focus_area: SystemDesign
sector: quick_commerce
difficulty: Senior
---

# System Design Seeds — Quick Commerce

## Core prompts

- Design order dispatch system meeting 10–30 minute delivery SLA in dense city.
- Design courier location tracking and ETA prediction for customers.
- Design store inventory service with POS and picker app consistency.
- Design surge handling when demand exceeds courier supply in a zone.
- Design substitution flow when picker finds item out of stock mid-order.
- Design partner fleet integration as overflow when internal couriers saturated.

## Requirements to clarify

- SLA target by city zone; penalty for miss rate.
- Batch vs solo dispatch rules; max customer wait before dispatch.
- Inventory authority: dark store WMS vs manual override.
- Payment capture relative to picking start and delivery confirm.
- Weather or event demand spikes—manual ops overrides needed?

## Architecture probes

- Real-time geo indexing for courier availability.
- Order state machine: placed → picking → picked → en route → delivered / cancelled.
- Queue depth per zone triggering throttle or expanded radius.
- ETA model features: distance, traffic, historical segment duration, time of day.
- Push notification batching vs per-event during delays.

## Failure and edge cases

- GPS jitter breaking map UX and ETA trust.
- Double assignment of courier to two orders.
- Inventory lag causing post-pick cancellation—customer compensation flow.
- Payment succeeded but no courier available—refund SLA.

## Observability and rollout

- Metrics: avg delivery time, SLA miss %, cancellation rate, courier utilization, support tickets.
- Zone-level dashboards for ops during peak dinner window.
- Feature flags for batching algorithm tuning without deploy.
- Postmortem on rain/day-without-outage patterns for staffing model.

## Evaluation rubric

Strong answers optimize ops metrics (SLA, cancellations, utilization) not only CRUD order API.
