from __future__ import annotations

import re
from typing import Any, Optional

from .knowledge_graph import format_planner_graph_rationale, planner_graph_context, build_graph_paths


SKILL_SIGNALS: dict[str, list[str]] = {
    "redis": ["redis", "cache", "caching", "memcached"],
    "distributed_consistency": [
        "consistency",
        "distributed",
        "replication",
        "consensus",
        "cap theorem",
        "eventual consistency",
        "strong consistency",
    ],
    "system_design": ["system design", "scalability", "scale", "architecture", "microservice"],
    "metrics_impact": ["metric", "kpi", "impact", "latency", "throughput", "conversion", "percent"],
    "tradeoffs": ["tradeoff", "trade-off", "alternative", "constraint", "versus"],
    "validation": ["test", "validation", "monitoring", "observability", "slo", "alert"],
    "ownership": ["owned", "ownership", "led", "drove", "initiated", "stakeholder"],
    "star_structure": ["situation", "task", "action", "result", "star"],
    "api_design": ["api", "rest", "graphql", "endpoint", "contract"],
    "database": ["sql", "postgres", "mysql", "database", "schema", "index"],
    "cloud": ["aws", "gcp", "azure", "kubernetes", "docker", "terraform"],
    "ml_production": ["model serving", "feature store", "ml pipeline", "drift", "rag"],
}

GAP_PROBE_INTENTS: dict[str, str] = {
    "redis": "cache reliability, invalidation, and failure handling at scale",
    "distributed_consistency": "distributed consistency tradeoffs and conflict resolution",
    "system_design": "scalable architecture with clear boundaries and bottlenecks",
    "metrics_impact": "measurable impact with concrete before/after metrics",
    "tradeoffs": "explicit tradeoffs between speed, quality, and cost",
    "validation": "validation strategy, monitoring, and rollback plan",
    "ownership": "end-to-end ownership and cross-team coordination",
    "star_structure": "structured storytelling with context, action, and result",
    "api_design": "API contract design, versioning, and backward compatibility",
    "database": "data modeling, query performance, and integrity constraints",
    "cloud": "cloud reliability, cost, and operational readiness",
    "ml_production": "production ML/RAG quality, evaluation, and guardrails",
}

PRIORITY_TARGET_INTENTS: dict[str, str] = {
    "metrics": "quantifiable impact and success metrics",
    "structure": "clear STAR structure with explicit result",
    "technical_depth": "deeper technical reasoning and implementation detail",
    "tradeoffs": "explicit alternatives considered and rejected",
    "validation": "how success was measured and risks mitigated",
    "ownership": "personal ownership and decision accountability",
}


def _normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").lower()).strip()


def extract_skills_from_text(text: str) -> set[str]:
    normalized = _normalize_text(text)
    if not normalized:
        return set()
    found: set[str] = set()
    for skill, patterns in SKILL_SIGNALS.items():
        if any(pattern in normalized for pattern in patterns):
            found.add(skill)
    return found


def build_skill_coverage(
    *,
    cv_facts: list[str],
    user_memory: list[dict[str, Any]],
    previous_turns: list[dict[str, str]],
    memory_profile: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    cv_skills: set[str] = set()
    for fact in cv_facts:
        cv_skills |= extract_skills_from_text(str(fact))

    demonstrated: set[str] = set()
    for turn in previous_turns:
        demonstrated |= extract_skills_from_text(str(turn.get("answer", "")))
        demonstrated |= extract_skills_from_text(str(turn.get("question", "")))

    for item in user_memory:
        demonstrated |= extract_skills_from_text(str(item.get("content", "")))
        meta = item.get("meta") or {}
        for tag in meta.get("question_topic_tags") or []:
            demonstrated |= extract_skills_from_text(str(tag))

    memory_gaps: set[str] = set()
    profile = memory_profile or {}
    for target in profile.get("priority_targets") or []:
        key = str(target).strip().lower()
        if key in PRIORITY_TARGET_INTENTS:
            memory_gaps.add(key)

    skill_gaps = sorted((cv_skills - demonstrated) | memory_gaps)
    return {
        "cv_skills": sorted(cv_skills),
        "demonstrated_skills": sorted(demonstrated),
        "skill_gaps": skill_gaps,
    }


def build_question_plan(
    *,
    profession: str,
    config: dict[str, Any],
    asked_topics: list[str],
    asked_questions: list[str],
    previous_turns: list[dict[str, str]],
    retrieval_evidence: Optional[list[dict[str, Any]]] = None,
    rag_summary: str = "",
) -> dict[str, Any]:
    cv_facts = [str(item) for item in (config.get("cv_facts") or [])[:8]]
    user_memory = list(config.get("user_memory") or [])[:12]
    memory_profile = config.get("memory_profile") or {}
    coaching_policy = config.get("coaching_policy") or {}

    coverage = build_skill_coverage(
        cv_facts=cv_facts,
        user_memory=user_memory,
        previous_turns=previous_turns,
        memory_profile=memory_profile,
    )

    company = str(config.get("target_company") or config.get("company_pack") or "").strip()
    difficulty = str(config.get("difficulty") or "Junior").strip()
    focus_area = str(config.get("focus_area") or "Mixed").strip()
    sector = str(config.get("sector") or "").strip()

    intent_parts: list[str] = []
    rationale_parts: list[str] = []

    for gap in coverage["skill_gaps"][:4]:
        probe = GAP_PROBE_INTENTS.get(gap) or PRIORITY_TARGET_INTENTS.get(gap)
        if probe and probe not in intent_parts:
            intent_parts.append(probe)
            if gap in coverage["cv_skills"]:
                rationale_parts.append(
                    f"CV mentions {gap.replace('_', ' ')} but prior answers did not demonstrate it deeply."
                )
            elif gap in PRIORITY_TARGET_INTENTS:
                rationale_parts.append(
                    f"Memory profile flags recurring weakness in {gap.replace('_', ' ')}."
                )

    for rule in coaching_policy.get("question_rules") or []:
        rule_text = str(rule).strip()
        if rule_text and rule_text not in rationale_parts:
            rationale_parts.append(rule_text)

    if company and company.lower() not in {"general", ""}:
        rationale_parts.append(f"Calibrated for {company} interview loop expectations at {difficulty} level.")

    if sector:
        rationale_parts.append(f"Sector context: {sector}.")

    kb_doc_types: list[str] = []
    for ev in (retrieval_evidence or [])[:4]:
        doc_type = str(ev.get("doc_type") or ev.get("collection") or "").strip()
        if doc_type and doc_type not in kb_doc_types:
            kb_doc_types.append(doc_type)
    if kb_doc_types:
        rationale_parts.append(f"Grounded using knowledge base: {', '.join(kb_doc_types)}.")

    if rag_summary:
        rationale_parts.append("RAG retrieval informed role/company rubric alignment.")

    graph_hits = planner_graph_context(
        profession=profession,
        company=company,
        skill_gaps=coverage["skill_gaps"],
        user_memory=user_memory,
        cv_facts=cv_facts,
    )
    graph_paths = build_graph_paths(graph_hits, retrieval_evidence or [])
    graph_rationale = format_planner_graph_rationale(graph_hits)
    if graph_rationale:
        rationale_parts.append(graph_rationale)

    if not intent_parts:
        intent_parts.append(f"{profession} {focus_area.lower()} depth with metrics and tradeoffs")

    question_intent = "; ".join(intent_parts[:3])
    why_this_question = " ".join(rationale_parts[:4]).strip()
    if not why_this_question:
        why_this_question = (
            f"Probing {profession} readiness for {difficulty} {focus_area.lower()} questions "
            "with emphasis on impact, tradeoffs, and validation."
        )

    return {
        "question_intent": question_intent,
        "why_this_question": why_this_question,
        "skill_coverage": coverage,
        "signals_used": {
            "cv_facts": bool(cv_facts),
            "user_memory": bool(user_memory),
            "company": company or None,
            "role": profession,
            "difficulty": difficulty,
            "focus_area": focus_area,
            "sector": sector or None,
            "kb_doc_types": kb_doc_types,
            "priority_targets": list(memory_profile.get("priority_targets") or [])[:5],
            "asked_topics": asked_topics[-8:],
            "asked_questions_count": len(asked_questions),
        },
        "expected_evidence": [
            "metric or scale signal",
            "tradeoff reasoning",
            "validation or monitoring approach",
        ],
        "graph_relations": graph_hits[:5],
        "graph_paths": graph_paths[:5],
    }


def format_question_rationale(plan: dict[str, Any]) -> str:
    if not plan:
        return ""
    parts: list[str] = []
    why = str(plan.get("why_this_question") or "").strip()
    if why:
        parts.append(why)
    intent = str(plan.get("question_intent") or "").strip()
    if intent:
        parts.append(f"Intent: {intent}.")
    gaps = (plan.get("skill_coverage") or {}).get("skill_gaps") or []
    if gaps:
        labels = [g.replace("_", " ") for g in gaps[:3]]
        parts.append(f"Targeting gaps: {', '.join(labels)}.")
    return " ".join(parts).strip()
