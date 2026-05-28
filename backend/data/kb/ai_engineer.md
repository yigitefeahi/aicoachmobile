---
doc_type: role
profession: ai_engineer
focus_area: Mixed
---

# AI Engineer — Interview Coaching Knowledge Base

## Role overview

AI engineer interviews focus on shipping LLM-powered products safely: retrieval, prompting, tool use, evaluation, latency, cost, and guardrails. Interviewers distinguish hobby prompt tinkering from production AI engineering with measurement, fallbacks, and operational discipline. This role overlaps ML engineering but emphasizes application layer and product integration.

## Core competencies

- RAG design: chunking, metadata, hybrid retrieval, reranking, citation grounding
- Prompt engineering: system prompts, few-shot, structured outputs, tool calling
- Evaluation: golden sets, human review, automated faithfulness/relevance metrics
- Safety: PII handling, injection resistance, content filters, human-in-the-loop
- Production: caching, streaming, timeouts, model routing, cost caps
- Observability: trace prompts, retrieval hits, user feedback loops, regression alerts

## Interview themes

Expect deep dives on an LLM feature you built, reducing hallucinations, retrieval failures, eval methodology, and cost/latency tradeoffs. System design may cover customer support bot, document Q&A, or coding assistant architecture. Thesis-relevant projects should articulate RAG vs fine-tuning choice with evidence.

## Question bank

**Technical:** LLM/RAG feature and quality metrics. Reducing hallucinations while staying useful. Logging/monitoring for customer-facing assistant. Retrieval failure handling. Quality vs latency vs cost balance.

**System design:** Internal knowledge assistant, interview coach, or ticket summarizer—include eval and fallback paths.

**Behavioral:** Launched AI feature that underperformed—what changed? Pushing back on "just add ChatGPT" requests from product.

## Strong answer framework

Define user task and failure cost first. Describe retrieval + generation pipeline, eval set size and metrics, production monitoring, and fallback when confidence is low. Always mention what you log and how you detect regressions after prompt or corpus changes.

## Strong answer signals

- Names Hit@k, MRR, or human rubric scores—not only "it felt better"
- Discusses chunk strategy, metadata filters, or reranker with reasoning
- Mentions citation grounding, abstention, or safe refusal templates
- Includes cost per request and latency p95 in production discussion
- Describes ablation: RAG off vs on, reranker off vs on

Example strong fragment: "We added cross-encoder reranking on top 20 vector hits. Hit@3 on our 40-question golden set went from 0.55 to 0.78. p95 latency rose 180ms, acceptable for async coaching. We alert when faithfulness score drops below 0.85 on nightly eval."

## Weak answer signals and red flags

- Black-box LLM with no eval or fallback
- Ignores prompt injection and PII in user uploads
- Retrieval described as "embed everything once"
- No mention of latency, cost, or rate limits
- Cannot explain a wrong answer incident and fix

## Common interviewer follow-ups

- When would you fine-tune instead of RAG?
- How do you handle stale documents in the corpus?
- What if the retriever returns irrelevant chunks?
- How do you version prompts and roll back?
- How do you collect user feedback for continuous improvement?

## Seniority signals

**Junior:** Implements prompts and basic RAG with supervision. **Mid:** Owns eval harness and production feature. **Senior:** Sets AI platform patterns, governance, cost controls, cross-team standards.

## Coaching tips

For graduation projects, emphasize measurable retrieval quality and inspector/debug tooling. Connect to company context: bank AI needs compliance; gaming AI may need tone and latency. Always pair capability claims with eval evidence.
## Example answer snippets

**Weak:** "We connected OpenAI API and it answers users."
**Strong:** "Our coach bot hallucinated policy details. I added retrieval with company metadata filters, citation-required prompt, and nightly golden-set eval (40 questions). Faithfulness below 0.85 blocks prompt promotion in CI. User thumbs-down rate fell 31% over three weeks."

## Local market context

Graduation and product teams increasingly expect RAG evaluation evidence, not demo-only AI. For bank clients, emphasize PII redaction, audit logs, and abstention when retrieval confidence is low.
## Deep-dive topic bank

Study: chunk overlap tradeoffs; metadata filters; hybrid BM25+vector; reranker latency; prompt injection; PII redaction; eval stratification; human rubric vs RLHF; model fallback; token budgets; streaming UX; embedding vs completion cache.
