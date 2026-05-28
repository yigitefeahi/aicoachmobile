---
doc_type: question_seed
focus_area: Mixed
sector: ecommerce
difficulty: Mixed
---

# E-Commerce & Marketplace Interview Question Seeds

## Trendyol / Hepsiburada — marketplace scale

- Handle duplicate orders or inventory inconsistencies in high-traffic checkout.
- Prepare system for major campaign (11.11, Black Friday)—what broke and permanent fix?
- Design seller inventory sync with conflict resolution rules.
- Experiment improving conversion or seller/buyer experience with measurable results.
- How do you protect checkout when recommendation or search services fail?

## Catalog, search, and discovery

- Design product search with facets at marketplace scale.
- Handle stale price or stock in search results vs checkout truth.
- Explain category browse caching and invalidation on seller update.

## Fulfillment and operations

- Split shipment, partial cancel, and refund state machine design.
- Seller SLA metrics—how engineering supports ops dashboards.
- Return flow integration with warehouse and payment refund timing.

## Behavioral

- Campaign peak incident—you owned what and measured what?
- Dispute between seller portal team and buyer checkout on data model.
- Launch that hurt conversion—rollback and learning.

## Technical probes

- Flash sale inventory: Redis atomic decrement vs DB locking.
- Idempotency on payment retry from mobile WebView.
- Load test assumptions for 10x traffic hour.
- Fraud or promo abuse during campaign—detection edges.

## Quick-commerce crossover

- Getir-style delivery SLA questions: see quick_commerce_question_seeds.md and strong_weak_quick_commerce_examples.md.

## Adaptive follow-ups

- GMV, conversion, oversell rate, or support ticket delta?
- What was canary scope before full campaign?
- Seller vs buyer impact separated in analysis?

Company rubrics: trendyol, hepsiburada, getir. Examples: strong_weak_ecommerce_examples.md.
