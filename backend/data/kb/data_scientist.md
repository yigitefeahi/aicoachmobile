---
doc_type: role
profession: data_scientist
focus_area: Mixed
---

# Data Scientist — Interview Coaching Knowledge Base

## Role overview

Data scientist interviews blend statistics, experimentation, modeling, and storytelling to business stakeholders. Interviewers assess whether you frame problems correctly, choose metrics aligned with decisions, and avoid elegant models that fail in production or mislead executives. Communication weighs as heavily as technical skill in many loops.

## Core competencies

- Problem framing: objective, decision, baseline, constraints
- Statistics: hypothesis testing, confidence intervals, power, multiple comparisons
- Modeling: regression, classification, clustering; bias-variance; regularization
- Experimentation: A/B design, guardrails, novelty effects, segment analysis
- Data wrangling: missing data, outliers, leakage, sampling bias
- Communication: executive summaries, visualizations, actionable recommendations

## Interview themes

Case studies dominate: metric selection, experiment interpretation, model evaluation, causal vs correlational claims. Technical questions cover leakage, imbalanced classification, and when not to use ML. Behavioral probes stakeholder influence and handling ambiguous requests.

## Question bank

**Technical:** Model you built and how you evaluated it. Preventing data leakage. Metrics for imbalanced classification. A/B test you ran and learnings. Explaining results to non-technical leaders.

**Case:** Conversion dropped 10%—how investigate? Should we launch this model? Design experiment for new pricing.

**Behavioral:** Stakeholder wanted bad analysis—how handled? Project where simple solution beat complex model.

## Strong answer framework

State decision maker and metric they care about. Describe data, method, uncertainty, and recommendation with risks. For experiments: hypothesis, sample size intuition, guardrail metrics, duration, result, and decision—not only p-value.

## Strong answer signals

- Distinguishes correlation from causation; mentions confounders
- Uses baseline comparison and confidence intervals, not only accuracy
- Explains why metric matches business harm (cost, churn, revenue)
- Acknowledges limitations and what data would change recommendation
- Simple interpretable model chosen when appropriate

Example strong fragment: "Leadership wanted churn prediction, but the decision was retention offers budget. We optimized precision at top decile because false positives wasted credits. Uplift test showed 8% retention lift in target segment, not global accuracy gains."

## Weak answer signals and red flags

- Jump to random forest without problem definition
- Random train/test split on time-series data
- Cannot explain model to product manager in plain language
- Overclaims causation from observational data
- Ignores ethical bias or fairness questions when relevant

## Common interviewer follow-ups

- What would you do with only two weeks of data?
- How do you handle multiple testing across segments?
- What features might leak the label?
- How would you monitor model after deployment?
- When is a rules-based approach better?

## Seniority signals

**Junior:** Runs analyses with review. **Mid:** Owns experiments and models for a product area. **Senior:** Influences metric definitions org-wide, mentors on causal rigor, partners with execs on strategy.

## Coaching tips

Practice translating one technical result into a three-sentence executive summary. Bring one experiment story with guardrails and one modeling story with leakage avoided. Turkish telecom/e-commerce examples resonate with funnel and campaign analysis.
## Example answer snippets

**Weak:** "Random forest had the best accuracy so we used it."
**Strong:** "Retention offer targeting needed interpretability for compliance review. We used logistic regression with calibrated scores and uplift modeling on holdout. Top decile showed 7% retention lift vs control; global accuracy was misleading due to class imbalance."

## Local market context

Turkish product teams often need Turkish-language executive summaries. Tie analysis to revenue, churn, or operational cost. Be explicit about data limitations and what experiment would validate next.
## Deep-dive topic bank

Prepare: power analysis; multiple testing correction; Simpson's paradox; uplift modeling; causal limits; time-series CV; segmentation stability; confidence intervals for execs; early stopping ethics.
