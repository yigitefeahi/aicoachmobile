---
doc_type: story
focus_area: Mixed
sector: quick_commerce
---

# Strong vs Weak Examples — Quick Commerce & Last-Mile Delivery

## Dispatch efficiency (technical)

**Weak:**
"We optimized the routing algorithm and deliveries got faster."

**Strong:**
"Getir-style peak dinner window: courier idle time 18% due to batching threshold too conservative. I analyzed order-ready signals vs courier GPS, tuned batch radius dynamically by demand heatmap, and capped wait at 90s before solo dispatch. Average delivery time -4.2 min during peak; courier utilization +11%; customer ETA accuracy within 3 min for 87% of orders vs 71% before."

## Peak demand incident (behavioral)

**Weak:**
"Orders spiked and we added more couriers."

**Strong:**
"Situation: Rain storm doubled demand in Istanbul zone; SLA miss rate hit 22%. Task: I owned temporary ops-tech playbook. Action: geo-fenced surge pricing pause (product call), disabled non-core promo API load, enabled manual overflow to partner fleet integration, comms template for delayed orders. Result: SLA miss down to 9% within 3 hours; postmortem added automatic zone throttle when queue depth > threshold."

## Inventory sync at store level (technical)

**Weak:**
"We sync inventory from stores to the app."

**Strong:**
"Dark store SKU availability drift caused 6% order cancellations. Root cause: eventual sync lag + manual override without timestamp. I implemented versioned stock records, conflict rule (POS wins within 60s), and customer-facing 'just sold out' graceful substitute flow. Cancellation rate 6% → 1.8%; picker pick-time unchanged."

## Real-time tracking UX (technical)

**Weak:**
"We show courier on map with GPS."

**Strong:**
"Map jitter from raw GPS caused support calls ('courier going wrong way'). Applied Kalman smoothing, snapped to route polyline after pickup, and predictive ETA using historical segment speeds by hour. 'Where is my order' tickets -31%; NPS for delivery +6 points in A/B."

Evaluator note: quick-commerce answers must tie to delivery SLA, courier ops, peak windows, and cancellation rate—not generic e-commerce checkout only.
