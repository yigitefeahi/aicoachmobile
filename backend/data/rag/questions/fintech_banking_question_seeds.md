---
doc_type: question_seed
focus_area: Mixed
sector: fintech
difficulty: Mixed
---

# Fintech & Banking Interview Question Seeds

## Payments and wallet

- How would you design a wallet top-up flow that survives client retries without double charging?
- Explain idempotency keys in payment APIs. Where do you store them and how long?
- How do you reconcile gateway settlement files with internal ledger rows?
- What happens when payment gateway returns timeout but money actually moved?
- Design P2P transfer with daily limits, fraud checks, and audit trail.

## Security, fraud, and compliance

- Walk through investigating a spike in velocity alerts after a campaign.
- How do you store and rotate API keys and customer PII in a mobile fintech app?
- What audit logs are required for admin actions on customer accounts?
- Explain KYC onboarding failure cases: expired ID, provider timeout, name mismatch.
- How would you handle a suspected account takeover without locking legitimate users?

## Digital banking (Garanti, Akbank-style)

- How do you migrate a customer-facing feature without breaking core banking integration?
- Describe rollback plan for a change affecting transaction posting.
- How do you test money-moving features beyond unit tests?
- Explain staged rollout for regulated environments with compliance sign-off.

## Behavioral (sector-fit)

- Tell me about a production issue affecting customer money. What did you do in the first hour?
- Describe balancing feature speed with security or audit requirements.
- Share a time you pushed back on a release that failed validation gates.
- How did you communicate an incident to non-technical stakeholders and customers?

## Technical depth probes

- ACID vs eventual consistency—where do you draw the line in a wallet system?
- How do you design ledger entries for refunds and partial captures?
- What metrics alert you before customers notice payment failures?
- How do you load-test payment flows without moving real money?

## Adaptive follow-ups

- What metric proved the fix worked (success rate, duplicate rate, support tickets)?
- What would reconciliation catch that unit tests would miss?
- Who signed off before production (risk, compliance, finance)?
