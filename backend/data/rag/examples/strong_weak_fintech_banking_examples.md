---
doc_type: story
focus_area: Mixed
sector: fintech
---

# Strong vs Weak Examples — Fintech & Banking

## Payment idempotency (technical)

**Weak:**
"I would use a database and make sure payments don't duplicate."

**Strong:**
"Requirements: mobile wallet top-up must survive client retries and gateway timeouts without double charge. I used POST /topups with Idempotency-Key stored in a unique index, status enum (pending, succeeded, failed), and reconciliation job comparing gateway settlement file to ledger rows nightly. Duplicate attempt rate dropped from 0.6% to under 0.01%; finance sign-off required before prod cutover."

## Fraud alert investigation (behavioral)

**Weak:**
"I checked the logs and blocked suspicious users."

**Strong:**
"Situation: velocity alerts spiked 3x after a marketing campaign. Task: I owned triage without blocking legitimate users. Action: I segmented by device fingerprint, geo, and first-time vs returning payers; found SDK bug sending duplicate events. Paired with mobile team, hotfixed, and tuned rule thresholds using campaign baseline. Result: false positive rate down 41%, fraud catch rate unchanged, support tickets for blocked accounts down 28% in 48 hours."

## Regulated release (behavioral)

**Weak:**
"We tested it and released to production."

**Strong:**
"I led digital onboarding change touching KYC provider integration. I wrote rollback plan, staged rollout by 5% traffic, and aligned with compliance on audit log fields. UAT included negative cases: expired ID, mismatched name, provider timeout. After launch, completion rate +9% with zero compliance findings in first audit window."

## Core banking integration (technical)

**Weak:**
"We call the bank API when the user transfers money."

**Strong:**
"Transfer flow uses outbox pattern: local transaction writes ledger + outbox row, worker publishes to core banking adapter with retry and DLQ. Responses map to idempotent status updates; ambiguous timeouts stay pending until reconciliation query. We alert on pending > 15 minutes. Incidents of 'stuck pending' dropped 70% after adding reconciliation cron every 5 minutes."

## Security and access (technical)

**Weak:**
"We use JWT and HTTPS so it's secure."

**Strong:**
"Customer PII never logged in plain text; tokens are short-lived with refresh rotation. Admin actions require step-up MFA and immutable audit trail (who, when, before/after hash). Secrets in vault with 90-day rotation. Pen test finding on verbose error messages fixed by mapping internal codes to safe client messages."

Evaluator note: fintech/banking strong answers mention money correctness, reconciliation, audit, fraud edges, and staged rollout—not only happy path.
