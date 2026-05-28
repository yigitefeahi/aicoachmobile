---
doc_type: question_seed
focus_area: SystemDesign
sector: ecommerce
difficulty: Senior
---

# System Design Seeds — E-Commerce & Marketplace

## Core prompts

- Design marketplace checkout with inventory reservation and seller split settlements.
- Design flash sale system for limited SKU without oversell.
- Design product search and ranking with fresh price/stock signals.
- Design seller portal inventory sync with millions of SKUs.
- Design promotion engine stacking coupons, seller promos, and platform campaigns safely.
- Design order tracking and notification system across multi-leg shipments.

## Requirements to clarify

- GMV peak multiplier during campaign; read vs write ratio on catalog.
- Oversell tolerance: zero vs rare compensating transactions.
- Seller vs platform responsibility on stock truth source.
- Payment capture timing vs shipment trigger.
- International: tax, currency, return policies (if in scope).

## Architecture probes

- Cart service sharding; hold TTL and release on payment timeout.
- Redis Lua vs DB row lock for high-contention SKU decrement.
- Search index freshness vs checkout source of truth reconciliation.
- Idempotent payment and order create across mobile retry.
- Event-driven seller notification on order state changes.

## Failure and edge cases

- Recommendation service down—checkout still works?
- Partial shipment cancel—refund orchestration saga.
- Seller bulk upload corrupts prices—detection and rollback.
- Campaign config error applying 100% discount—kill switch.

## Observability and rollout

- Metrics: conversion funnel, checkout error, oversell count, p95 checkout latency.
- Load test at 6–10x normal before 11.11 / Black Friday.
- Canary on payment provider or new cart logic by user segment.
- Real-time dashboard for ops during campaign hour.

## Evaluation rubric

Strong candidates protect checkout path, prevent oversell invariants, and cite campaign war stories with metrics.
