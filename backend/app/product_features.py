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


def _parse_interview_date(interview_date: str | None) -> date | None:
    raw = (interview_date or "").strip()
    if not raw:
        return None
    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d.%m.%Y"):
        try:
            return datetime.strptime(raw[:10] if fmt == "%Y-%m-%d" else raw, fmt).date()
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00")).date()
    except ValueError:
        return None


def _resolve_roadmap_schedule(today: date, interview_date: str | None) -> tuple[date | None, int]:
    target = _parse_interview_date(interview_date)
    if target is None:
        return None, 0
    delta = (target - today).days
    if delta < 0:
        days_left = 3
    elif delta == 0:
        days_left = 1
    else:
        days_left = min(30, max(1, delta))
    return target, days_left


def _normalize_roadmap_focus(focus_area: str | None) -> str:
    focus = str(focus_area or "Mixed").strip()
    allowed = {
        "Mixed",
        "Behavioral",
        "Technical",
        "Product Sense",
        "System Design",
        "Market Sizing",
        "Problem Solving",
        "Communication",
    }
    return focus if focus in allowed else "Mixed"


def _company_prep_hint(company: dict[str, Any]) -> str:
    rubric = ", ".join(str(item) for item in (company.get("rubric_focus") or [])[:3])
    styles = ", ".join(str(item) for item in (company.get("question_styles") or [])[:2])
    label = str(company.get("label") or "General Interview")
    if rubric and styles:
        return f"{label} loop — emphasize {rubric}; expect {styles}"
    if rubric:
        return f"{label} loop — emphasize {rubric}"
    return f"{label} interview expectations"


def _roadmap_day_templates(
    focus: str,
    profession: str,
    company: dict[str, Any],
) -> list[tuple[str, str, str]]:
    company_hint = _company_prep_hint(company)
    company_label = str(company.get("label") or "Company")
    role = profession or "your role"

    pools: dict[str, list[tuple[str, str, str]]] = {
        "Mixed": [
            ("Baseline mock", f"Run one full {role} session with Mixed focus and capture weak scorecard dimensions.", "Mixed"),
            ("Story vault", "Save two STAR stories with metrics and clear personal impact.", "Behavioral"),
            ("Company loop", f"Practice one answer calibrated to {company_hint}.", company_label),
            ("Case drill", "Do one product/system case prompt with assumptions, framework, and recommendation.", "Case"),
            ("Tone pass", "Reduce filler/hedging and keep spoken answers under two minutes.", "Communication"),
            ("Final simulation", f"Timed mock interview for {role}; review scorecard and rewrite the weakest answer.", "Mixed"),
        ],
        "Technical": [
            ("Technical baseline", f"Run a Technical {role} mock emphasizing depth, validation, and failure handling.", "Technical"),
            ("Debugging story", "Practice one incident narrative: signal, root cause, fix, and prevention.", "Technical"),
            ("System constraint drill", "Answer one scaling/reliability question with tradeoffs, bottlenecks, and monitoring.", "Technical"),
            ("Company technical bar", f"Answer one hard Technical question using {company_hint}.", company_label),
            ("Depth rewrite", "Take a shallow answer and add rejected alternatives, metrics, and a test plan.", "Technical"),
            ("Final technical simulation", f"Timed technical loop for {role} aligned with {company_label} rubric.", "Technical"),
        ],
        "Behavioral": [
            ("Behavioral baseline", f"Run a Behavioral-focused {role} mock with STAR structure and ownership clarity.", "Behavioral"),
            ("STAR story bank", "Write three STAR stories: conflict, impact, and failure/recovery.", "Behavioral"),
            ("Company behavioral bar", f"Practice one Behavioral answer mapped to {company_hint}.", company_label),
            ("Stakeholder narrative", "Tell one story about cross-team influence, disagreement, or prioritization.", "Behavioral"),
            ("Metric upgrade", "Rewrite one behavioral answer with a before/after metric and business outcome.", "Behavioral"),
            ("Final behavioral simulation", f"Timed behavioral loop for {role} with {company_label} expectations.", "Behavioral"),
        ],
        "System Design": [
            ("Design baseline", f"Run one System Design prompt for {role} with requirements and constraints first.", "System Design"),
            ("Tradeoff drill", "Compare two architectures and justify the chosen option with risks and mitigations.", "System Design"),
            ("Scale event prep", "Design for a traffic spike or regional outage with observability and rollback.", "System Design"),
            ("Company design bar", f"Practice one design question aligned with {company_hint}.", company_label),
            ("Data model pass", "Add schema/API boundaries, consistency model, and failure modes to one design.", "System Design"),
            ("Final design simulation", f"45-minute whiteboard-style design review for {role}.", "System Design"),
        ],
        "Product Sense": [
            ("Product baseline", f"Run one Product Sense prompt for {role}: goal, users, and success metric.", "Product Sense"),
            ("Metric tree drill", "Define north-star metric, input metrics, and one experiment you would run.", "Product Sense"),
            ("Company product bar", f"Practice one product judgment question using {company_hint}.", company_label),
            ("Prioritization story", "Rank three roadmap items with impact, effort, and risk rationale.", "Product Sense"),
            ("User insight pass", "Add user segment, pain point, and validation plan to one product answer.", "Product Sense"),
            ("Final product simulation", f"Timed product loop for {role} with recommendation and tradeoffs.", "Product Sense"),
        ],
        "Market Sizing": [
            ("Estimation baseline", "Solve one market sizing prompt with explicit assumptions and sanity checks.", "Market Sizing"),
            ("Segment breakdown", "Split TAM into segments, pick one wedge, and estimate reachable share.", "Market Sizing"),
            ("Company estimation bar", f"Practice one estimation-style question in the context of {company_hint}.", company_label),
            ("Sensitivity drill", "Change two assumptions and explain how the estimate moves.", "Market Sizing"),
            ("Recommendation close", "Turn the estimate into a go/no-go recommendation with risks.", "Market Sizing"),
            ("Final sizing simulation", f"Timed estimation loop for {role} with structured math and narrative.", "Market Sizing"),
        ],
        "Problem Solving": [
            ("Problem baseline", f"Run one ambiguous {role} problem with clarified goals before solving.", "Problem Solving"),
            ("Framework drill", "Use a clear framework (breakdown, constraints, options, recommendation).", "Problem Solving"),
            ("Company problem bar", f"Practice one ambiguous loop question using {company_hint}.", company_label),
            ("Edge-case pass", "Add failure modes, invalid inputs, and monitoring to one solution.", "Problem Solving"),
            ("Speed vs quality", "Explain when you would ship fast vs invest more with a concrete example.", "Problem Solving"),
            ("Final problem simulation", f"Timed problem-solving loop for {role}.", "Problem Solving"),
        ],
        "Communication": [
            ("Communication baseline", f"Run one {role} mock focusing on clarity, structure, and concision.", "Communication"),
            ("90-second story", "Compress one strong answer to 90 seconds without losing the result.", "Communication"),
            ("Company communication bar", f"Practice one answer emphasizing {company_hint}.", company_label),
            ("Tone cleanup", "Record one answer; reduce filler, hedging, and long sentences on retry.", "Communication"),
            ("Executive summary", "Explain a technical decision to a non-technical stakeholder in 60 seconds.", "Communication"),
            ("Final communication simulation", f"Timed spoken loop for {role} with delivery review.", "Communication"),
        ],
    }
    return list(pools.get(focus, pools["Mixed"]))


def _weekly_drill_templates(
    focus: str,
    profession: str,
    company: dict[str, Any],
) -> list[dict[str, Any]]:
    company_label = str(company.get("label") or "General Interview")
    company_hint = _company_prep_hint(company)
    role = profession or "your role"

    pools: dict[str, list[dict[str, Any]]] = {
        "Mixed": [
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
                "goal": f"Practice one answer against the {company_label} rubric focus.",
                "duration_minutes": 30,
                "actions": [
                    f"Start a session targeting {company_label}.",
                    f"Use this bar: {company_hint}.",
                    "Review the scorecard and rewrite the weakest section.",
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
        ],
        "Technical": [
            {
                "title": "Technical Depth Sprint",
                "goal": f"Push one {role} answer from surface-level to production-ready depth.",
                "duration_minutes": 30,
                "actions": [
                    "Pick one technical question from a recent session.",
                    "Add constraints, rejected alternatives, validation, and one metric.",
                    f"Check alignment with {company_hint}.",
                ],
                "success_criteria": "Answer includes tradeoffs, validation, and a measurable outcome.",
            },
            {
                "title": "Incident Narrative",
                "goal": "Practice a debugging/production incident story with clear ownership.",
                "duration_minutes": 25,
                "actions": [
                    "Write signal → diagnosis → fix → prevention.",
                    "Include one metric or SLA impact.",
                    "Save the polished story to Story Vault.",
                ],
                "success_criteria": "Story shows personal action, root cause, and prevention follow-up.",
            },
            {
                "title": "Company Technical Loop",
                "goal": f"Answer one hard technical question for {company_label}.",
                "duration_minutes": 35,
                "actions": [
                    f"Start setup with {company_label} and Technical focus.",
                    "Ask for a hint before the hardest question.",
                    "Rewrite the weakest technical section after scoring.",
                ],
                "success_criteria": "Technical depth and problem_solving both improve on rewrite.",
            },
            {
                "title": "System Tradeoff Drill",
                "goal": "Practice architecture tradeoffs under time pressure.",
                "duration_minutes": 30,
                "actions": [
                    "Pick one scaling or reliability prompt.",
                    "Compare two designs and justify the chosen option.",
                    "Add failure modes and monitoring.",
                ],
                "success_criteria": "Answer names at least one tradeoff and one mitigation.",
            },
        ],
        "Behavioral": [
            {
                "title": "STAR Bank Build",
                "goal": "Prepare three behavioral stories ready for rapid reuse.",
                "duration_minutes": 30,
                "actions": [
                    "Write conflict, impact, and failure/recovery stories in STAR format.",
                    "Add one metric per story.",
                    f"Tailor one story to {company_hint}.",
                ],
                "success_criteria": "Each story has explicit Action and Result with personal ownership.",
            },
            {
                "title": "Behavioral Mock",
                "goal": f"Run a Behavioral-only loop for {role}.",
                "duration_minutes": 25,
                "actions": [
                    "Start setup with Behavioral focus.",
                    "Answer two behavioral prompts without jargon-heavy drift.",
                    "Review structure and communication on the scorecard.",
                ],
                "success_criteria": "Both answers follow STAR and stay under two minutes.",
            },
            {
                "title": "Company Behavioral Bar",
                "goal": f"Practice one answer against {company_label} behavioral expectations.",
                "duration_minutes": 25,
                "actions": [
                    f"Use {company_hint} as a checklist while drafting.",
                    "Emphasize ownership and measurable impact.",
                    "Rewrite the opening 20 seconds for clarity.",
                ],
                "success_criteria": "Answer clearly maps to at least two company rubric focus areas.",
            },
            {
                "title": "Stakeholder Influence",
                "goal": "Tell one cross-team influence story with a crisp result.",
                "duration_minutes": 20,
                "actions": [
                    "Pick a disagreement or prioritization story.",
                    "State stakeholder goals and your specific action.",
                    "Close with a business or delivery outcome.",
                ],
                "success_criteria": "Story shows influence without vague team-only language.",
            },
        ],
        "System Design": [
            {
                "title": "Design Warm-up",
                "goal": f"Practice one System Design prompt for {role} with explicit requirements.",
                "duration_minutes": 35,
                "actions": [
                    "Clarify users, scale, and consistency needs before designing.",
                    "Draw components, data flow, and failure modes.",
                    f"Check fit with {company_hint}.",
                ],
                "success_criteria": "Design includes tradeoffs, bottlenecks, and monitoring.",
            },
            {
                "title": "Tradeoff Review",
                "goal": "Compare two architecture options with a clear recommendation.",
                "duration_minutes": 30,
                "actions": [
                    "Pick one prior design answer or prompt.",
                    "List pros/cons for two options.",
                    "Choose one option and name the main risk.",
                ],
                "success_criteria": "Recommendation is justified with constraints and risks.",
            },
            {
                "title": "Scale Event Drill",
                "goal": "Prepare for traffic spikes or partial outages.",
                "duration_minutes": 30,
                "actions": [
                    "Design caching, queueing, or degradation strategy.",
                    "Add rollback and observability plan.",
                    "Estimate one latency or availability metric.",
                ],
                "success_criteria": "Plan covers detection, mitigation, and recovery.",
            },
            {
                "title": "Company Design Bar",
                "goal": f"Run one design question aligned with {company_label}.",
                "duration_minutes": 40,
                "actions": [
                    f"Use {company_hint} while selecting design priorities.",
                    "State assumptions and non-goals upfront.",
                    "Close with phased rollout plan.",
                ],
                "success_criteria": "Answer reflects company rubric focus and role context.",
            },
        ],
        "Product Sense": [
            {
                "title": "Product Metric Tree",
                "goal": "Build a metric tree for one product scenario.",
                "duration_minutes": 30,
                "actions": [
                    "Define user, problem, and north-star metric.",
                    "Add two input metrics and one guardrail metric.",
                    f"Relate choices to {company_hint}.",
                ],
                "success_criteria": "Metric tree links user behavior to business outcome.",
            },
            {
                "title": "Prioritization Drill",
                "goal": "Rank roadmap items with impact, effort, and risk.",
                "duration_minutes": 25,
                "actions": [
                    "Pick three feature ideas.",
                    "Score and rank them with explicit rationale.",
                    "Name one experiment to validate the top choice.",
                ],
                "success_criteria": "Ranking includes tradeoffs and a validation step.",
            },
            {
                "title": "Product Case Sprint",
                "goal": f"Run one Product Sense case for {role}.",
                "duration_minutes": 35,
                "actions": [
                    "Start Case Mode with product_sense selected.",
                    "State assumptions, options, recommendation, and metric.",
                    "Review clarity and structure on the scorecard.",
                ],
                "success_criteria": "Final answer has recommendation plus success metric.",
            },
            {
                "title": "Company Product Bar",
                "goal": f"Practice one product judgment question for {company_label}.",
                "duration_minutes": 25,
                "actions": [
                    f"Apply {company_hint} while drafting.",
                    "Include user segment and pain point.",
                    "Close with measurable impact.",
                ],
                "success_criteria": "Answer shows product judgment and company alignment.",
            },
        ],
        "Market Sizing": [
            {
                "title": "Estimation Sprint",
                "goal": "Solve one market sizing prompt with explicit assumptions.",
                "duration_minutes": 30,
                "actions": [
                    "Break problem into segments and formulas.",
                    "State assumptions and sanity-check the result.",
                    f"Frame one insight for {company_label} context.",
                ],
                "success_criteria": "Estimate includes assumptions, math, and sanity check.",
            },
            {
                "title": "Sensitivity Drill",
                "goal": "Show how changing assumptions moves the estimate.",
                "duration_minutes": 25,
                "actions": [
                    "Pick one base estimate.",
                    "Change two inputs and explain directional impact.",
                    "Recommend go/no-go based on range.",
                ],
                "success_criteria": "Sensitivity analysis is explicit and logical.",
            },
            {
                "title": "Structured Math Pass",
                "goal": "Practice top-down and bottom-up estimation.",
                "duration_minutes": 25,
                "actions": [
                    "Run both approaches on the same prompt.",
                    "Compare results and reconcile differences.",
                    "Save the cleaner version to Story Vault.",
                ],
                "success_criteria": "Both methods are shown and reconciled.",
            },
            {
                "title": "Company Estimation Bar",
                "goal": f"Practice one estimation-style loop for {company_label}.",
                "duration_minutes": 30,
                "actions": [
                    f"Use {company_hint} to choose what matters commercially.",
                    "Keep narration structured while calculating.",
                    "End with recommendation and risks.",
                ],
                "success_criteria": "Answer combines math, narrative, and recommendation.",
            },
        ],
        "Problem Solving": [
            {
                "title": "Ambiguity Drill",
                "goal": f"Clarify goals before solving one ambiguous {role} problem.",
                "duration_minutes": 25,
                "actions": [
                    "Write clarifying questions and assumptions.",
                    "Break the problem into sub-problems.",
                    "Recommend one path with risks.",
                ],
                "success_criteria": "Solution starts with clarified goals and framework.",
            },
            {
                "title": "Option Comparison",
                "goal": "Generate and compare three solution options.",
                "duration_minutes": 30,
                "actions": [
                    "List three options with pros/cons.",
                    "Pick one and justify with constraints.",
                    f"Align recommendation with {company_hint}.",
                ],
                "success_criteria": "Comparison is structured and constraint-aware.",
            },
            {
                "title": "Edge-case Pass",
                "goal": "Harden one solution against failure modes.",
                "duration_minutes": 25,
                "actions": [
                    "Add invalid inputs, retries, and monitoring.",
                    "Explain how you would validate the fix.",
                    "Rewrite the final 30 seconds for clarity.",
                ],
                "success_criteria": "Answer includes failure handling and validation.",
            },
            {
                "title": "Timed Problem Loop",
                "goal": f"Run one timed Problem Solving session for {role}.",
                "duration_minutes": 30,
                "actions": [
                    "Start setup with Problem Solving focus.",
                    "Use framework → options → recommendation.",
                    "Review problem_solving and clarity scores.",
                ],
                "success_criteria": "Answer stays structured under time pressure.",
            },
        ],
        "Communication": [
            {
                "title": "90-Second Compression",
                "goal": "Deliver one strong answer in 90 seconds.",
                "duration_minutes": 20,
                "actions": [
                    "Pick your best story or technical answer.",
                    "Cut filler and hedge words.",
                    "Record twice and compare tone signals.",
                ],
                "success_criteria": "Second attempt is shorter with same core result.",
            },
            {
                "title": "Executive Summary",
                "goal": "Explain a technical decision to a non-technical listener.",
                "duration_minutes": 25,
                "actions": [
                    "Pick one technical topic from recent practice.",
                    "Write a 60-second plain-language summary.",
                    f"Check whether it reflects {company_hint}.",
                ],
                "success_criteria": "Summary avoids jargon and states impact clearly.",
            },
            {
                "title": "Presence Delivery Drill",
                "goal": "Practice spoken delivery with the presence interviewer.",
                "duration_minutes": 25,
                "actions": [
                    "Run one presence session.",
                    "Focus on pace, confidence, and concise endings.",
                    "Review tone signals after submission.",
                ],
                "success_criteria": "Confidence and concision improve on a second attempt.",
            },
            {
                "title": "Company Communication Bar",
                "goal": f"Practice one answer emphasizing {company_label} communication bar.",
                "duration_minutes": 20,
                "actions": [
                    f"Use {company_hint} as a delivery checklist.",
                    "Open with context, close with result.",
                    "Rewrite weak opening lines.",
                ],
                "success_criteria": "Answer is structured, concise, and company-aligned.",
            },
        ],
    }

    return list(pools.get(focus, pools["Mixed"]))


def build_roadmap(
    profession: str,
    target_company: str | None,
    interview_date: str | None,
    focus_area: str | None,
    user_memory: list[dict[str, Any]] | None = None,
    cv_facts: list[str] | None = None,
) -> dict[str, Any]:
    today = date.today()
    target, days_left = _resolve_roadmap_schedule(today, interview_date)
    company = company_pack_payload(normalize_company_pack(target_company, target_company))
    focus = _normalize_roadmap_focus(focus_area)
    memory_profile = _memory_profile_from_signals(user_memory)
    retrieval_evidence: list[dict[str, Any]] = []
    rag_summary = ""
    retrieval_quality: dict[str, Any] = {}
    try:
        from .rag import retrieve_for_roadmap

        rag_result = retrieve_for_roadmap(
            profession=profession,
            target_company=target_company or company["label"],
            focus_area=focus,
            interview_date=str(target) if target else "",
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
    templates = _roadmap_day_templates(focus, profession, company)
    priority_targets = [str(item) for item in (memory_profile.get("priority_targets") or []) if str(item).strip()]
    if memory_profile.get("metric_signal") == "needs_metrics":
        templates.insert(
            1,
            (
                "Metric upgrade",
                "Rewrite two answers with concrete before/after outcomes and measurable impact.",
                "Metrics",
            ),
        )
    if memory_profile.get("star_signal") == "needs_star_structure":
        templates.insert(
            1,
            (
                "STAR structure",
                "Convert one weak behavioral answer into explicit STAR format.",
                "Behavioral",
            ),
        )
    if "technical_depth" in priority_targets:
        templates.insert(
            2,
            (
                "Technical depth sprint",
                "Add constraints, alternatives, and validation to one technical answer.",
                "Technical",
            ),
        )
    if "tradeoffs" in priority_targets or "system_design" in (memory_profile.get("topic_gaps") or []):
        templates.insert(
            3,
            (
                "System design tradeoffs",
                "Practice one architecture question with tradeoff justification and scaling risks.",
                "System Design",
            ),
        )
    schedule = []
    for i in range(days_left):
        title, detail, day_focus = templates[i % len(templates)]
        schedule.append(
            {
                "day": i + 1,
                "date": str(today + timedelta(days=i)),
                "title": title,
                "detail": detail,
                "focus": day_focus,
                "evidence_note": evidence_notes[i % len(evidence_notes)] if evidence_notes else None,
                "priority_target": priority_targets[i % len(priority_targets)] if priority_targets else None,
            }
        )
    return {
        "profession": profession,
        "target_company": company["label"],
        "interview_date": str(target) if target else "",
        "focus_area": focus,
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
    focus = _normalize_roadmap_focus(focus_area or roadmap.get("focus_area"))
    memory_profile = _memory_profile_from_signals(user_memory)
    retrieval_evidence = roadmap.get("retrieval_evidence", [])
    evidence_notes = [
        str(item.get("preview", "")).strip()
        for item in retrieval_evidence
        if str(item.get("preview", "")).strip()
    ]
    weeks = max(1, min(4, (roadmap["days_left"] + 6) // 7)) if roadmap["days_left"] > 0 else 0
    templates = _weekly_drill_templates(focus, profession, company_pack_payload(normalize_company_pack(target_company, target_company)))
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
                "focus": focus,
                **base,
                "actions": actions[:5],
                "evidence_note": evidence_notes[week % len(evidence_notes)] if evidence_notes else None,
            }
        )
    return {
        "profession": profession,
        "target_company": company,
        "interview_date": roadmap["interview_date"],
        "focus_area": focus,
        "weeks": weeks,
        "drills": drills,
        "retrieval_evidence": retrieval_evidence,
        "rag_summary": roadmap.get("rag_summary"),
        "retrieval_quality": roadmap.get("retrieval_quality"),
    }
