---
doc_type: role
profession: data_engineer
focus_area: Mixed
---

# Data Engineer — Interview Coaching Knowledge Base

## Role overview

Data engineers build pipelines that downstream analytics, ML, and reporting depend on. Interviews test pipeline design, data correctness, schema evolution, and operational maturity—not tool name dropping. A failed pipeline at 6 AM matters as much as architecture diagrams; interviewers want idempotency, SLAs, and recovery stories.

## Core competencies

- Batch and streaming ingestion, orchestration, dependency management
- Data modeling: staging, curated layers, star/snowflake, event schemas
- Quality: validation rules, anomaly detection, reconciliation, data contracts
- Warehousing: partitioning, clustering, cost-aware storage, incremental loads
- Reliability: retries, dead letters, backfills, exactly-once/at-least-once semantics
- Security and governance: PII masking, access control, lineage

## Interview themes

Describe a pipeline you owned, handle late data or schema changes, explain a data incident, design incremental loads for high-volume events, compare batch vs streaming tradeoffs. SQL and Python often appear. System design covers event pipeline to warehouse to metrics layer.

## Question bank

**Technical:** Pipeline correctness guarantees. Late-arriving data and schema evolution. Production data incident and permanent fix. Incremental loads for event stream. Batch vs micro-batch vs streaming.

**SQL:** Deduplication, slowly changing dimensions, window functions for sessionization.

**Behavioral:** Downstream team angry about broken table—your response. Negotiating data contract with product analytics.

## Strong answer framework

Define SLA and consumers first. Diagram sources → ingest → transform → serve, with validation gates at each stage. For incidents: detection, blast radius, temporary fix, permanent fix, prevention alert. Quantify: freshness lag, failed row rate, cost per TB.

## Strong answer signals

- Idempotency keys or merge strategy for deduplication explained clearly
- Data quality tests in CI or Airflow/Dagster checks before publish
- Partition strategy tied to query patterns and cost
- Lineage or ownership documentation for critical tables
- Impact on ML or executive dashboards when pipeline fails

Example strong fragment: "Duplicate events from mobile retry doubled revenue metrics. We keyed merges on event_id with MERGE in BigQuery and added a daily reconciliation job against source counts. Finance dashboard variance went from 3% to under 0.1%."

## Weak answer signals and red flags

- Only lists Airflow, Spark, Kafka without failure design
- No data quality or ownership model
- Cannot explain backfill strategy safely
- Ignores cost of full table scans or unpartitioned tables
- "Analytics team handles quality" with no DE accountability

## Common interviewer follow-ups

- Exactly-once possible here or why not?
- How do you version breaking schema changes?
- What alerts fire before users notice bad data?
- How long does backfill take and how do you throttle?
- How do you test pipeline logic before production?

## Seniority signals

**Junior:** Maintains DAGs with review. **Mid:** Designs pipelines and quality framework for a domain. **Senior:** Sets platform standards, data contracts org-wide, incident command for data outages.

## Coaching tips

Use one reconciliation story and one schema migration story. For bank/fintech contexts, emphasize audit trails and immutable raw layers. Numbers on freshness SLAs and incident duration strengthen answers.
## Example answer snippets

**Weak:** "I built an Airflow DAG that loads data daily."
**Strong:** "Marketing spend feed arrived late and duplicated on retries. I implemented merge on (campaign_id, date, source) with partition pruning and freshness SLA alert at T+1 08:00. Downstream attribution dashboard variance dropped under 0.2%."

## Local market context

Bank and telecom data platforms require lineage, access control, and immutable raw layers. E-commerce pipelines peak on sale days—mention backpressure, replay strategy, and coordination with analytics before campaigns.
## Deep-dive topic bank

Know: SCD types; stream dedup; dead letters; schema registry; incremental merges; orchestrator sensors; safe backfills; partition pruning cost; PII tokenization; column lineage; freshness SLAs beyond task green.
