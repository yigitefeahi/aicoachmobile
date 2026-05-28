---
doc_type: question_seed
focus_area: Technical
sector: aviation
difficulty: Mixed
---

# Technical Interview Seeds — Aviation & Travel

## Search and inventory

- Cache fare results—TTL vs inventory freshness tradeoff.
- Handle last-seat race: hold token vs optimistic booking.
- Explain why search index may differ from booking availability.
- Shard search by route group or date for peak campaigns.

## Booking and payments

- 3DS mobile web flow—timeout and retry UX plus server state.
- Idempotent booking confirm after payment gateway callback.
- Partial failure: payment OK, ticket issue fails—saga compensation steps.
- Multi-passenger booking atomicity—one fails, all rollback?

## Mobile and passenger flows

- Boarding pass offline access—security vs UX.
- Deep link from email campaign to pre-filled search.
- Push notification batching during mass delay.
- Localization: airport codes, timezone for departure reminders.

## Reliability

- Load test assumptions for bayram peak—search vs checkout.
- Degrade search facets before dropping core availability query.
- PSS timeout fallback—show stale with warning vs hard error.
- Runbook: disable promotions when inventory sync lag > threshold.

## Debugging scenarios

- Conversion drop at payment step—funnel analysis checklist.
- Oversell incident—trace hold release and confirm path.
- Wrong fare displayed—cache invalidation vs rule engine bug.
- Check-in fails for valid ticket—document scan edge cases.

## Strong answer signals

Passenger impact language, peak readiness, inventory invariants, ops coordination, conversion and call-center metrics.

## Weak answer signals

Generic e-commerce answers ignoring PSS integration, holds, and IRROPS; no peak or cost awareness.
