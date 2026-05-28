---
doc_type: question_seed
focus_area: Technical
sector: ecommerce
difficulty: Mixed
---

# Technical Interview Seeds — E-Commerce & Marketplace

## Checkout and inventory

- Redis atomic decrement vs SELECT FOR UPDATE for flash SKU.
- Idempotency-Key design for mobile payment retry.
- Cart merge on login—conflict resolution rules.
- Payment authorized but order create fails—compensation steps.

## Search and catalog

- Faceted search index update lag handling in UI.
- Seller bulk price upload validation and rollback.
- Category cache invalidation on seller attribute change.

## Promotions and fraud

- Stacking rules evaluation order for platform + seller coupons.
- Detect abnormal discount application during campaign misconfig.
- Velocity limits on account creation + first purchase promo.

## Performance

- Load test parameters for 10x checkout TPS campaign hour.
- Connection pool exhaustion on cart service—symptoms and fix.
- CDN vs origin for product images at campaign scale.

## Debugging scenarios

- Duplicate orders after payment redirect—investigation checklist.
- Oversell on one SKU during flash sale—trace hold and confirm.
- Conversion drop only on Android WebView checkout.

## Strong answer signals

Oversell prevention, idempotency, campaign peak metrics, seller/buyer separation in analysis.

## Weak answer signals

Generic shop CRUD; ignores marketplace seller sync; no payment edge cases.
