---
doc_type: story
focus_area: Mixed
sector: defense
---

# Strong vs Weak Examples — Defense & Aerospace Technology

## Mission-critical integration (technical)

**Weak:**
"We integrated the modules and tested them in the lab."

**Strong:**
"I owned radar data ingest adapter connecting legacy bus to modern analytics service. Requirements: no silent data loss, replay after link recovery, and traceable message IDs for audit. I added sequence checks, DLQ for malformed frames, and soak test at 2x expected throughput for 72 hours. Field trial showed zero undetected gaps over 30 days; defect escape rate for interface class dropped 60% vs prior release."

## Verification under schedule pressure (behavioral)

**Weak:**
"We were late so we skipped some documentation and fixed it later."

**Strong:**
"Situation: Milestone review required evidence for safety-related config change. Task: I could not cut verification scope without formal waiver. Action: I reprioritized non-critical features, delivered automated regression suite for config matrix (14 cases), and completed traceability sheet linking requirement IDs to tests. Result: milestone passed on date; audit finding count zero; team adopted matrix template for next programs."

## Cross-disciplinary design review (behavioral)

**Weak:**
"Electrical and software teams met and agreed on the design."

**Strong:**
"TUSAŞ-style review for sensor firmware update: hardware team flagged timing constraint on interrupt handler. I presented two options—DMA batching vs priority ceiling—with latency numbers (worst case 4.2ms vs 1.1ms) and risk to missed samples. Review board chose DMA with added watchdog; I documented decision rationale in configuration management system per process."

## Security and access control (technical)

**Weak:**
"We use VPN and passwords for the defense network."

**Strong:**
"I implemented role-based access for test bench tools: operators read-only on production configs, engineers staged changes in signed build pipeline, admins dual-control for deployment keys. All actions logged to immutable store. Internal assessment closed three findings on shared credential use; access review cycle reduced from ad hoc to quarterly."

## Late defect prevention (technical)

**Weak:**
"We found a bug in QA and fixed it before release."

**Strong:**
"Integration test missed endianness bug on target hardware. I added hardware-in-the-loop nightly job, static analysis rule for portable serialization, and checklist item for cross-platform struct packing in design reviews. Same defect class not seen in subsequent three releases across two programs."

Evaluator note: defense/aerospace strong answers emphasize verification, traceability, safety, documentation, and personal accountability—not generic agile velocity.
