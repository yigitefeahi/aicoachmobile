---
doc_type: role
profession: site_reliability_engineer
focus_area: Mixed
---

# Site Reliability Engineer — Interview Coaching Knowledge Base

## Role overview

SRE interviews measure reliability engineering judgment: SLOs, error budgets, incident response, observability, and sustainable on-call—not heroics. Google popularized the role but companies adapt it; core signal is balancing velocity with customer-visible stability through automation and blameless learning.

## Core competencies

- SLOs/SLIs/error budgets: defining, measuring, policy when budget burns
- Incident management: triage, mitigation, comms, postmortems, action items
- Observability: metrics, logs, traces, useful dashboards vs vanity charts
- Capacity: load testing, autoscaling, quotas, graceful degradation
- Toil reduction: automation, runbooks, self-service platforms
- Release safety: canaries, feature flags, rollback criteria

## Interview themes

Describe incidents with root cause and permanent fix, design alerting that reduces noise, explain SLO choices, discuss postmortem quality, improve reliability without killing delivery. Coding may be scripting or troubleshooting scenarios; system design often reliability-focused.

## Question bank

**Technical:** Incident you resolved—RCA and long-term fix. SLO vs best-effort monitor. Alerting design for noisy service. Strong vs weak postmortem. Reliability improvement without slowing teams.

**System design:** Design SLO monitoring for payment API. Multi-region failover with error budget policy.

**Behavioral:** On-call burnout—what changed? Disagreement with dev on launch readiness.

## Strong answer framework

Customer impact first (users affected, duration, revenue or SLA breach). Timeline of detection → mitigation → fix. Blameless RCA categories: process, tooling, architecture. Preventive actions with owners and dates. Tie to error budget or SLO if applicable.

## Strong answer signals

- Defines SLI in user terms (successful checkout, not CPU %)
- Alert routes on symptom + SLO burn rate, not every threshold twitch
- Postmortem has measurable follow-ups, not vague "be more careful"
- Automation eliminated recurring manual toil with hours saved
- Balances reliability investment with product priority using error budget

Example strong fragment: "Checkout SLO is 99.9% success over 30 days. Burn-rate alert fired on dependency timeouts before user spike finished. We added circuit breaker and cached catalog fallback; error budget consumption dropped 70% next quarter."

## Weak answer signals and red flags

- Hero narrative with no systemic fix
- Tool worship (PagerDuty, Prometheus) without SLO framing
- Alerts that page on every blip; on-call fatigue ignored
- Blames individual engineer in incident story
- No metrics on incident frequency or MTTR improvement

## Common interviewer follow-ups

- What is out of SLO scope intentionally?
- How do you handle third-party dependency failures?
- When do you freeze releases?
- How do game days or chaos tests fit your program?
- Difference between monitoring and observability?

## Seniority signals

**Junior:** On-call with runbooks, contributes postmortems. **Mid:** Owns SLOs for service group, leads incidents. **Senior:** Defines reliability culture, platform tooling, error budget policy org-wide.

## Coaching tips

Use Google SRE vocabulary only when precise—error budget, toil, SLI. Pegasus or bank contexts: peak travel or end-of-month traffic readiness stories land well. Quantify MTTR and repeat incident reduction.
## Example answer snippets

**Weak:** "I'm on-call and fix outages when alerts fire."
**Strong:** "Payment dependency timeouts burned 40% of monthly error budget in one week. I led incident, added adaptive timeout + bulkhead isolation, and SLO burn-rate alert. Repeat timeout incidents dropped 85% next month; no increase in failed checkout rate."

## Local market context

Pegasus and e-commerce peaks need proactive capacity and game-day planning. Turkish consumers feel downtime during campaigns or travel holidays— quantify customer impact in incidents.
## Deep-dive topic bank

Know: SLI math; error budget actions; alert fatigue metrics; runbook quality; IC responsibilities; status comms; postmortem tracking; capacity headroom; circuit breakers; load shedding; game days; toil percentage.
