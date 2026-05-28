from __future__ import annotations

from datetime import date, datetime, timedelta
import re
from typing import Any


COMPANY_PACKS: dict[str, dict[str, Any]] = {
    "general": {
        "label": "General Interview",
        "rubric_focus": ["clarity", "structure", "role fit", "specificity"],
        "question_styles": ["behavioral", "technical depth", "communication"],
    },
    "google": {
        "label": "Google",
        "rubric_focus": ["structured problem solving", "technical depth", "data-informed tradeoffs"],
        "question_styles": ["ambiguity handling", "scale", "collaboration"],
    },
    "meta": {
        "label": "Meta",
        "rubric_focus": ["impact", "execution speed", "metrics", "ownership"],
        "question_styles": ["conflict", "product impact", "system scale"],
    },
    "stripe": {
        "label": "Stripe",
        "rubric_focus": ["clarity", "user/customer empathy", "precision", "long-term thinking"],
        "question_styles": ["tradeoffs", "quality bar", "business impact"],
    },
    "amazon": {
        "label": "Amazon",
        "rubric_focus": ["ownership", "customer obsession", "bias for action", "measurable results"],
        "question_styles": ["leadership principles", "operational rigor", "failure recovery"],
    },
    "apple": {
        "label": "Apple",
        "rubric_focus": ["craft", "simplicity", "cross-functional influence", "quality"],
        "question_styles": ["product judgement", "detail orientation", "collaboration"],
    },
    "aselsan": {
        "label": "Aselsan",
        "rubric_focus": ["engineering rigor", "security awareness", "process discipline", "system reliability"],
        "question_styles": ["defense systems", "quality assurance", "technical depth", "team coordination"],
    },
    "tusas": {
        "label": "TUSAŞ",
        "rubric_focus": ["aerospace quality", "safety culture", "engineering fundamentals", "documentation"],
        "question_styles": ["design verification", "risk management", "cross-disciplinary work", "precision"],
    },
    "turkcell": {
        "label": "Turkcell",
        "rubric_focus": ["digital product impact", "customer metrics", "scale", "agile delivery"],
        "question_styles": ["telecom scale", "product experimentation", "data-driven decisions", "ownership"],
    },
    "turktelekom": {
        "label": "Turk Telekom",
        "rubric_focus": ["enterprise reliability", "infrastructure depth", "transformation", "stakeholder alignment"],
        "question_styles": ["network and platform", "large-org delivery", "operational stability", "customer focus"],
    },
    "trendyol": {
        "label": "Trendyol",
        "rubric_focus": ["e-commerce scale", "performance", "execution speed", "measurable impact"],
        "question_styles": ["high traffic systems", "marketplace logic", "experimentation", "ownership"],
    },
    "havelsan": {
        "label": "Havelsan",
        "rubric_focus": ["defense software quality", "security", "systems thinking", "verification"],
        "question_styles": ["mission-critical systems", "integration", "technical documentation", "reliability"],
    },
    "getir": {
        "label": "Getir",
        "rubric_focus": ["speed", "operational efficiency", "ownership", "practical tradeoffs"],
        "question_styles": ["hypergrowth delivery", "logistics tech", "incident handling", "metrics"],
    },
    "hepsiburada": {
        "label": "Hepsiburada",
        "rubric_focus": ["marketplace scale", "customer experience", "performance", "collaboration"],
        "question_styles": ["e-commerce systems", "seller/buyer flows", "reliability", "data-informed product"],
    },
    "garanti": {
        "label": "Garanti BBVA",
        "rubric_focus": ["security and compliance", "financial correctness", "reliability", "customer trust"],
        "question_styles": ["digital banking", "fraud prevention", "regulated delivery", "audit readiness"],
    },
    "akbank": {
        "label": "Akbank",
        "rubric_focus": ["banking reliability", "security", "data integrity", "enterprise delivery"],
        "question_styles": ["core banking adjacency", "digital channels", "risk controls", "stakeholder alignment"],
    },
    "papara": {
        "label": "Papara",
        "rubric_focus": ["fintech speed", "payment correctness", "security", "mobile product impact"],
        "question_styles": ["payments", "wallet flows", "fraud edges", "fast iteration"],
    },
    "peak": {
        "label": "Peak Games",
        "rubric_focus": ["gamecraft", "performance", "live ops", "player metrics"],
        "question_styles": ["mobile games", "retention", "A/B experimentation", "technical polish"],
    },
    "dreamgames": {
        "label": "Dream Games",
        "rubric_focus": ["game systems", "craft", "scale", "data-informed design"],
        "question_styles": ["puzzle games", "live content", "performance", "team collaboration"],
    },
    "pegasus": {
        "label": "Pegasus",
        "rubric_focus": ["operational efficiency", "reliability", "customer experience", "cost awareness"],
        "question_styles": ["airline ops tech", "booking and pricing adjacency", "incident handling", "scale events"],
    },
    "microsoft": {
        "label": "Microsoft",
        "rubric_focus": ["growth mindset", "technical depth", "collaboration", "customer impact"],
        "question_styles": ["cloud and enterprise", "system design", "ambiguity", "cross-team influence"],
    },
    "netflix": {
        "label": "Netflix",
        "rubric_focus": ["ownership", "judgment", "impact", "freedom and responsibility"],
        "question_styles": ["high trust culture", "context over control", "production excellence", "candid feedback"],
    },
}


COMPANY_ALIASES: dict[str, str] = {
    "trktelekom": "turktelekom",
    "turktelekom": "turktelekom",
    "tusa": "tusas",
    "garantibbva": "garanti",
    "garantiteknoloji": "garanti",
    "akode": "akbank",
    "peakgames": "peak",
    "zynga": "peak",
    "dreamgame": "dreamgames",
}


CASE_TYPES = {
    "product_sense": "Product Sense",
    "system_design": "System Design",
    "market_sizing": "Market Sizing",
}


SCORECARD_DIMENSIONS = [
    "clarity",
    "structure",
    "specificity",
    "impact",
    "metrics",
    "technical_depth",
    "problem_solving",
    "tradeoffs",
    "company_alignment",
    "role_fit",
    "communication",
    "confidence",
    "pace",
    "conciseness",
]


FILLER_PATTERNS = ["um", "uh", "like", "you know", "actually", "basically", "sort of", "kind of"]
HEDGING_PATTERNS = ["maybe", "probably", "i think", "i guess", "might", "somewhat", "possibly"]


def normalize_company_pack(target_company: str | None, company_pack: str | None = None) -> str:
    raw = (company_pack or target_company or "general").strip().lower()
    compact = re.sub(r"[^a-z0-9]+", "", raw)
    if compact in COMPANY_ALIASES:
        return COMPANY_ALIASES[compact]
    for key, pack in COMPANY_PACKS.items():
        if compact == key or compact == re.sub(r"[^a-z0-9]+", "", pack["label"].lower()):
            return key
    return "general"


def company_pack_payload(pack_id: str) -> dict[str, Any]:
    pack = COMPANY_PACKS.get(pack_id, COMPANY_PACKS["general"])
    return {"id": pack_id, **pack}


def get_company_packs() -> list[dict[str, Any]]:
    return [company_pack_payload(key) for key in COMPANY_PACKS]


def build_company_prompt_context(config: dict[str, Any]) -> dict[str, Any]:
    pack_id = normalize_company_pack(config.get("target_company"), config.get("company_pack"))
    pack = company_pack_payload(pack_id)
    return {
        "company_pack": pack,
        "rubric_focus": pack["rubric_focus"],
        "question_styles": pack["question_styles"],
    }


def build_case_question_prefix(config: dict[str, Any]) -> str:
    if config.get("mode") != "case":
        return ""
    case_type = str(config.get("case_type") or "product_sense")
    label = CASE_TYPES.get(case_type, "Product Sense")
    return f"{label} case: "


def _memory_profile_from_signals(user_memory: list[dict[str, Any]] | None) -> dict[str, Any]:
    user_memory = user_memory or []
    if not user_memory:
        return {"priority_targets": [], "metric_signal": "neutral", "star_signal": "neutral", "topic_gaps": [], "topic_strengths": []}

    weak_count: dict[str, float] = {}
    strong_count: dict[str, float] = {}
    topic_gaps: dict[str, float] = {}
    topic_strengths: dict[str, float] = {}
    metric_gap = 0.0
    metric_ok = 0.0
    star_gap = 0.0

    for idx, item in enumerate(user_memory):
        weight = max(0.35, 1.0 - (idx * 0.08))
        memory_type = str(item.get("memory_type") or "")
        meta = item.get("meta") if isinstance(item.get("meta"), dict) else {}
        dims = [str(dim) for dim in (meta.get("dimensions") or []) if str(dim).strip()]
        topics = [str(topic) for topic in (meta.get("question_topic_tags") or []) if str(topic).strip()]

        if memory_type == "weakness_pattern":
            for dim in dims:
                weak_count[dim] = weak_count.get(dim, 0.0) + weight
            for topic in topics:
                topic_gaps[topic] = topic_gaps.get(topic, 0.0) + weight
        elif memory_type == "strength_pattern":
            for dim in dims:
                strong_count[dim] = strong_count.get(dim, 0.0) + weight
            for topic in topics:
                topic_strengths[topic] = topic_strengths.get(topic, 0.0) + weight
        elif memory_type == "skill_gap":
            if str(meta.get("focus") or "") == "metrics":
                metric_gap += weight
            if str(meta.get("focus") or "") == "star_structure":
                star_gap += weight
        elif memory_type == "role_strength" and str(meta.get("focus") or "") == "metrics":
            metric_ok += weight

    pressure_rows = []
    for dim in set(weak_count) | set(strong_count):
        pressure_rows.append((dim, weak_count.get(dim, 0.0) - (0.75 * strong_count.get(dim, 0.0))))
    pressure_rows.sort(key=lambda item: item[1], reverse=True)
    priority_targets = [dim for dim, pressure in pressure_rows if pressure > 0.2][:4]
    if metric_gap > metric_ok + 0.2 and "metrics" not in priority_targets:
        priority_targets.insert(0, "metrics")
    if star_gap > 0.15 and "structure" not in priority_targets:
        priority_targets.append("structure")

    return {
        "priority_targets": priority_targets[:5],
        "metric_signal": "needs_metrics" if metric_gap > metric_ok + 0.2 else "neutral",
        "star_signal": "needs_star_structure" if star_gap > 0.15 else "neutral",
        "topic_gaps": [topic for topic, _ in sorted(topic_gaps.items(), key=lambda item: item[1], reverse=True)[:3]],
        "topic_strengths": [topic for topic, _ in sorted(topic_strengths.items(), key=lambda item: item[1], reverse=True)[:3]],
    }


def build_hint(question: str, config: dict[str, Any]) -> dict[str, Any]:
    profession = str(config.get("profession") or "")
    focus = str(config.get("focus_area") or "Mixed")
    mode = str(config.get("mode") or "text")
    company = company_pack_payload(normalize_company_pack(config.get("target_company"), config.get("company_pack")))
    memory_profile = config.get("memory_profile") if isinstance(config.get("memory_profile"), dict) else _memory_profile_from_signals(
        config.get("user_memory") if isinstance(config.get("user_memory"), list) else []
    )
    retrieval_evidence: list[dict[str, Any]] = []
    rag_summary = ""
    retrieval_quality: dict[str, Any] = {}
    try:
        from .rag import retrieve_for_hint

        rag_result = retrieve_for_hint(profession=profession, question=question, config=config)
        retrieval_evidence = rag_result.evidence
        rag_summary = rag_result.summary
        retrieval_quality = rag_result.quality
    except Exception:
        retrieval_evidence = []
        rag_summary = "RAG hint evidence unavailable; static hint fallback used."
        retrieval_quality = {"label": "none", "score": 0, "evidence_count": 0}
    if mode == "case":
        bullets = [
            "Start by clarifying the goal and constraints before solving.",
            "Name the framework you will use, then walk through it step by step.",
            "Finish with a recommendation, tradeoff, and metric you would track.",
        ]
    elif focus.lower() == "behavioral":
        bullets = [
            "Use STAR: Situation, Task, Action, Result.",
            "Add one concrete metric or business outcome.",
            "Make your personal contribution clear, not just the team's work.",
        ]
    else:
        bullets = [
            "State your assumptions before jumping into the solution.",
            "Explain the tradeoff you chose and one alternative you rejected.",
            "Close with validation: tests, metrics, monitoring, or rollout plan.",
        ]
    evidence_bullets = [
        str(item.get("preview", "")).strip()
        for item in retrieval_evidence
        if str(item.get("preview", "")).strip()
    ][:2]
    if memory_profile.get("metric_signal") == "needs_metrics":
        bullets.insert(0, "Your recent answers miss measurable outcomes: include one metric and why it matters.")
    if memory_profile.get("star_signal") == "needs_star_structure":
        bullets.insert(0, "Use explicit STAR framing so each part of the answer is easy to score.")
    priority_targets = [str(item) for item in (memory_profile.get("priority_targets") or []) if str(item).strip()]
    if evidence_bullets:
        bullets = (evidence_bullets + bullets)[:5]
    else:
        bullets = bullets[:5]
    personalized_hint = (
        f"Frame this for {company['label']} by emphasizing {', '.join(company['rubric_focus'][:2])}."
    )
    if priority_targets:
        personalized_hint = f"{personalized_hint} Personal focus: {', '.join(priority_targets[:2])}."
    return {
        "question": question,
        "hint": personalized_hint,
        "bullets": bullets,
        "retrieval_evidence": retrieval_evidence,
        "rag_summary": rag_summary,
        "retrieval_quality": retrieval_quality,
    }


def analyze_tone(answer_text: str) -> dict[str, Any]:
    text = (answer_text or "").lower()
    words = re.findall(r"[a-zA-Z']+", text)
    word_count = len(words)
    filler_count = sum(text.count(term) for term in FILLER_PATTERNS)
    hedging_count = sum(text.count(term) for term in HEDGING_PATTERNS)
    sentence_count = max(1, len(re.findall(r"[.!?]+", answer_text or "")))
    avg_sentence_words = round(word_count / sentence_count, 1)
    concision = max(0, min(100, 100 - max(0, word_count - 180) // 3 - filler_count * 4 - hedging_count * 5))
    confidence = max(0, min(100, 82 - hedging_count * 8 - filler_count * 3 + (8 if any(ch.isdigit() for ch in answer_text) else 0)))
    return {
        "word_count": word_count,
        "filler_count": filler_count,
        "hedging_count": hedging_count,
        "avg_sentence_words": avg_sentence_words,
        "concision": concision,
        "confidence_signal": confidence,
        "summary": (
            "Confident and concise"
            if confidence >= 75 and concision >= 75
            else "Good base; tighten hedging/filler language"
        ),
    }


def expand_scorecard(sub_scores: dict[str, int], answer_text: str, config: dict[str, Any]) -> dict[str, int]:
    tone = analyze_tone(answer_text)
    base = int(sum(sub_scores.values()) / max(1, len(sub_scores))) if sub_scores else 60
    has_metric = any(ch.isdigit() for ch in answer_text or "")
    pack_id = normalize_company_pack(config.get("target_company"), config.get("company_pack"))
    company_bonus = 8 if pack_id != "general" and str(config.get("target_company") or "").strip() else 0
    values = {
        "clarity": sub_scores.get("clarity", base),
        "structure": sub_scores.get("structure", base),
        "specificity": min(100, base + (10 if has_metric else -8)),
        "impact": min(100, base + (12 if has_metric else -10)),
        "metrics": min(100, 78 if has_metric else max(30, base - 18)),
        "technical_depth": sub_scores.get("technical_depth", base),
        "problem_solving": sub_scores.get("problem_solving", base),
        "tradeoffs": min(100, base + (8 if "trade" in (answer_text or "").lower() else -4)),
        "company_alignment": min(100, base + company_bonus),
        "role_fit": min(100, base + 4),
        "communication": sub_scores.get("communication", base),
        "confidence": sub_scores.get("confidence", tone["confidence_signal"]),
        "pace": min(100, max(25, 95 - max(0, tone["word_count"] - 220) // 4)),
        "conciseness": tone["concision"],
    }
    return {key: int(max(0, min(100, values.get(key, base)))) for key in SCORECARD_DIMENSIONS}


def build_roadmap(
    profession: str,
    target_company: str | None,
    interview_date: str | None,
    focus_area: str | None,
    user_memory: list[dict[str, Any]] | None = None,
    cv_facts: list[str] | None = None,
) -> dict[str, Any]:
    today = date.today()
    try:
        target = datetime.strptime(interview_date or "", "%Y-%m-%d").date()
    except ValueError:
        target = today + timedelta(days=14)
    days_left = max(3, min(30, (target - today).days or 14))
    company = company_pack_payload(normalize_company_pack(target_company, target_company))
    focus = focus_area or "Mixed"
    memory_profile = _memory_profile_from_signals(user_memory)
    retrieval_evidence: list[dict[str, Any]] = []
    rag_summary = ""
    retrieval_quality: dict[str, Any] = {}
    try:
        from .rag import retrieve_for_roadmap

        rag_result = retrieve_for_roadmap(
            profession=profession,
            target_company=target_company or "",
            focus_area=focus,
            interview_date=interview_date or "",
            user_memory=user_memory or [],
            cv_facts=cv_facts or [],
        )
        retrieval_evidence = rag_result.evidence
        rag_summary = rag_result.summary
        retrieval_quality = rag_result.quality
    except Exception:
        retrieval_evidence = []
        rag_summary = "RAG roadmap evidence unavailable; template fallback used."
        retrieval_quality = {"label": "none", "score": 0, "evidence_count": 0}
    evidence_notes = [
        str(item.get("preview", "")).strip()
        for item in retrieval_evidence
        if str(item.get("preview", "")).strip()
    ]
    templates = [
        ("Baseline mock", "Run one full session and capture weak dimensions."),
        ("Story vault", "Save two STAR stories with metrics and clear impact."),
        ("Company loop", f"Practice {company['label']} style questions and rubric focus."),
        ("Case drill", "Do one product/system/case prompt with a structured framework."),
        ("Tone pass", "Reduce filler/hedging and keep answers under two minutes."),
        ("Final simulation", "Run a timed interview and review the scorecard."),
    ]
    priority_targets = [str(item) for item in (memory_profile.get("priority_targets") or []) if str(item).strip()]
    if memory_profile.get("metric_signal") == "needs_metrics":
        templates.insert(1, ("Metric upgrade", "Rewrite two answers with concrete before/after outcomes and measurable impact."))
    if memory_profile.get("star_signal") == "needs_star_structure":
        templates.insert(1, ("STAR structure", "Convert one weak behavioral answer into explicit STAR format."))
    if "technical_depth" in priority_targets:
        templates.insert(2, ("Technical depth sprint", "Add constraints, alternatives, and validation to one technical answer."))
    if "tradeoffs" in priority_targets or "system_design" in (memory_profile.get("topic_gaps") or []):
        templates.insert(3, ("System design tradeoffs", "Practice one architecture question with tradeoff justification and scaling risks."))
    schedule = []
    for i in range(days_left):
        title, detail = templates[i % len(templates)]
        schedule.append(
            {
                "day": i + 1,
                "date": str(today + timedelta(days=i)),
                "title": title,
                "detail": detail,
                "focus": focus if i % 2 == 0 else company["label"],
                "evidence_note": evidence_notes[i % len(evidence_notes)] if evidence_notes else None,
                "priority_target": priority_targets[i % len(priority_targets)] if priority_targets else None,
            }
        )
    return {
        "profession": profession,
        "target_company": company["label"],
        "interview_date": str(target),
        "days_left": days_left,
        "schedule": schedule,
        "retrieval_evidence": retrieval_evidence,
        "rag_summary": rag_summary,
        "retrieval_quality": retrieval_quality,
    }


def build_weekly_drills(
    profession: str,
    target_company: str | None,
    interview_date: str | None,
    focus_area: str | None,
    user_memory: list[dict[str, Any]] | None = None,
    cv_facts: list[str] | None = None,
) -> dict[str, Any]:
    roadmap = build_roadmap(
        profession=profession,
        target_company=target_company,
        interview_date=interview_date,
        focus_area=focus_area,
        user_memory=user_memory,
        cv_facts=cv_facts,
    )
    company = roadmap["target_company"]
    focus = focus_area or "Mixed"
    memory_profile = _memory_profile_from_signals(user_memory)
    retrieval_evidence = roadmap.get("retrieval_evidence", [])
    evidence_notes = [
        str(item.get("preview", "")).strip()
        for item in retrieval_evidence
        if str(item.get("preview", "")).strip()
    ]
    weeks = max(1, min(4, (roadmap["days_left"] + 6) // 7))
    templates = [
        {
            "title": "Story Compression",
            "goal": "Turn one strong experience into a crisp 90-second STAR answer.",
            "duration_minutes": 25,
            "actions": [
                "Pick one leadership, conflict, or impact story.",
                "Write it in Situation, Task, Action, Result format.",
                "Add one metric and save the final answer to Story Vault.",
            ],
            "success_criteria": "Answer has clear personal ownership, one metric, and no more than 180 words.",
        },
        {
            "title": "Company Bar Drill",
            "goal": f"Practice one answer against the {company} rubric focus.",
            "duration_minutes": 30,
            "actions": [
                f"Start a company loop for {company}.",
                "Ask for a hint before answering the hardest question.",
                "Review the 14-dimension scorecard and rewrite the weakest section.",
            ],
            "success_criteria": "Top weakness is converted into a concrete rewrite or follow-up note.",
        },
        {
            "title": "Case Sprint",
            "goal": "Build structured thinking under light time pressure.",
            "duration_minutes": 35,
            "actions": [
                "Run one Case Mode prompt.",
                "State assumptions, framework, tradeoffs, and final recommendation.",
                "Check clarity, structure, tradeoffs, and metrics in the scorecard.",
            ],
            "success_criteria": "Final answer includes a framework, tradeoff, and measurable success metric.",
        },
        {
            "title": "Tone Cleanup",
            "goal": "Reduce hedging and filler language before the real interview.",
            "duration_minutes": 20,
            "actions": [
                "Record one audio or presence answer.",
                "Review filler count, hedging count, concision, and confidence signal.",
                "Repeat the answer once with shorter sentences and stronger verbs.",
            ],
            "success_criteria": "Filler count and hedging count both decrease on the second attempt.",
        },
    ]
    drills = []
    for week in range(weeks):
        base = templates[week % len(templates)]
        actions = list(base["actions"])
        priority_targets = [str(item) for item in (memory_profile.get("priority_targets") or []) if str(item).strip()]
        if memory_profile.get("metric_signal") == "needs_metrics":
            actions.insert(0, "Add one metric to every answer draft before you submit.")
        if memory_profile.get("star_signal") == "needs_star_structure":
            actions.insert(0, "Use STAR headings while drafting behavioral answers.")
        if "technical_depth" in priority_targets:
            actions.append("For each technical answer, include one rejected alternative and why.")
        if "tradeoffs" in priority_targets:
            actions.append("Explicitly name one tradeoff and one risk mitigation.")
        if evidence_notes:
            actions = [f"Use RAG evidence: {evidence_notes[week % len(evidence_notes)][:180]}"] + actions
        drills.append(
            {
                "week": week + 1,
                "label": f"Week {week + 1}",
                "focus": focus if week % 2 == 0 else company,
                **base,
                "actions": actions[:5],
                "evidence_note": evidence_notes[week % len(evidence_notes)] if evidence_notes else None,
            }
        )
    return {
        "profession": profession,
        "target_company": company,
        "interview_date": roadmap["interview_date"],
        "weeks": weeks,
        "drills": drills,
        "retrieval_evidence": retrieval_evidence,
        "rag_summary": roadmap.get("rag_summary"),
        "retrieval_quality": roadmap.get("retrieval_quality"),
    }
