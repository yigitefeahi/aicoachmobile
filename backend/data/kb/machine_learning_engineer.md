---
doc_type: role
profession: machine_learning_engineer
focus_area: Mixed
---

# Machine Learning Engineer — Interview Coaching Knowledge Base

## Role overview

ML engineer interviews verify you can move models from notebook to production with correct metrics, monitoring, and rollback discipline. Interviewers probe training-serving skew, data leakage, feature pipelines, and business-aligned evaluation—not paper accuracy alone. Strong candidates discuss baselines, deployment safety, and what happens when data drifts.

## Core competencies

- Feature engineering and reproducible training pipelines
- Offline metrics vs online metrics; A/B testing and guardrails
- Model serving: batch vs realtime, latency budgets, batching, GPU cost
- Data quality: leakage detection, label delay, sampling bias
- Monitoring: prediction drift, feature drift, performance decay
- MLOps basics: experiment tracking, model registry, CI for training code

## Interview themes

Walk through end-to-end ML feature shipment, design monitoring for ranking/recommendation, explain evaluation mistakes avoided, and discuss complexity vs latency vs revenue impact. Coding may include SQL feature extraction or simple model implementation. System design covers feature store, training pipeline, serving layer.

## Question bank

**Technical:** ML feature end-to-end and validation. Training-serving skew and drift handling. Evaluation mistake fixed—guardrails added. Monitoring for ranking model. Complexity vs latency vs business impact.

**System design:** Fraud detection, recommendation feed, or churn model at scale.

**Behavioral:** Model hurt metrics in A/B—decision process. Pushing back on premature deep learning when logistic regression suffices.

## Strong answer framework

Start with business metric and baseline (rules or simple model). Explain data sources, label definition, offline eval protocol, launch strategy (shadow/canary), and online monitoring. Close with decision threshold and rollback trigger.

## Strong answer signals

- States baseline and why new model beat it on right metric
- Mentions holdout by time for temporal data, not random split only
- Describes shadow mode or canary before full rollout
- Explains feature pipeline ownership and SLA for freshness
- Connects model decision to product KPI (CTR, fraud $, retention)

Example strong fragment: "Random split inflated AUC because future behavior leaked into features. We switched to time-based split and added point-in-time feature joins. Offline AUC dropped but online lift was real: fraud loss down 12% in canary."

## Weak answer signals and red flags

- Algorithm shopping without problem framing
- Accuracy on imbalanced data without precision/recall tradeoff discussion
- No production constraints: latency, cost, explainability
- Cannot describe monitoring after launch
- Team project with no personal pipeline or eval ownership

## Common interviewer follow-ups

- What is your label delay and how does it affect training?
- How often do you retrain and what triggers it?
- How do you debug a sudden metric drop?
- Explainability requirements from compliance or product?
- Cold start problem for new users/items?

## Seniority signals

**Junior:** Runs experiments with mentorship. **Mid:** Owns training and serving for a model family. **Senior:** Defines ML platform standards, eval culture, and risk review for launches.

## Coaching tips

Always name the wrong metric you avoided and why. For Turkish e-commerce, mention campaign seasonality and peak traffic on realtime scoring. Pair technical depth with one business number.
## Example answer snippets

**Weak:** "We trained XGBoost and got high accuracy."
**Strong:** "Fraud model needed recall on high-value transactions without flooding analysts. We optimized precision at top 2% score band using time-based validation. Canary deployment matched offline lift; analyst queue size stayed flat while fraud loss decreased 11%."

## Local market context

E-commerce and fintech ML in Turkey must handle campaign seasonality and imbalanced labels. Discuss point-in-time features, retrain triggers, and coordination with fraud ops teams.
## Deep-dive topic bank

Review: point-in-time joins; label leakage; calibration; class imbalance; feature store SLA; batch vs online inference; registry gates; shadow deploy; drift types; fairness when relevant; SHAP for regulated use; GPU cost vs latency.
