from app.interview_config import normalize_config, target_question_count
from app.interview_evaluation import score_reliability
from app.question_planner import (
    build_question_plan,
    build_skill_coverage,
    extract_skills_from_text,
    format_question_rationale,
)


def test_normalize_config_applies_defaults():
    cfg = normalize_config({})
    assert cfg["difficulty"] == "Junior"
    assert cfg["mode"] == "text"
    assert cfg["interview_length"] == "10 Questions"
    assert cfg["focus_area"] == "Mixed"


def test_target_question_count_maps_lengths():
    assert target_question_count("5 Questions") == 5
    assert target_question_count("10 Questions") == 10
    assert target_question_count("15 Questions") == 15
    assert target_question_count("20 Minutes") == 6
    assert target_question_count("30 Minutes") == 8


def test_score_reliability_high_consistency():
    rel = score_reliability([72, 73, 72, 74])
    assert rel["runs"] == 4
    assert rel["consistency_label"] in {"high", "moderate"}
    assert rel["std_dev"] <= 1.0


def test_score_reliability_low_consistency():
    rel = score_reliability([40, 75, 55, 90])
    assert rel["runs"] == 4
    assert rel["consistency_percent"] < 80


def test_extract_skills_from_cv_text():
    skills = extract_skills_from_text("Built caching layer with Redis for high-traffic API")
    assert "redis" in skills


def test_skill_coverage_detects_cv_gap():
    coverage = build_skill_coverage(
        cv_facts=["Used Redis for session cache at Meta scale"],
        user_memory=[],
        previous_turns=[{"question": "Tell me about yourself", "answer": "I worked on frontend features."}],
    )
    assert "redis" in coverage["cv_skills"]
    assert "redis" in coverage["skill_gaps"]


def test_question_plan_targets_company_and_gaps():
    plan = build_question_plan(
        profession="Backend Developer",
        config={
            "difficulty": "Senior",
            "focus_area": "Technical",
            "target_company": "Meta",
            "cv_facts": ["Redis cache for feed ranking"],
            "user_memory": [],
            "memory_profile": {"priority_targets": ["metrics"]},
            "coaching_policy": {"question_rules": ["Ask for measurable impact."]},
        },
        asked_topics=[],
        asked_questions=[],
        previous_turns=[],
        retrieval_evidence=[{"doc_type": "company_kb"}],
        rag_summary="Meta backend loop emphasizes scale.",
    )
    rationale = format_question_rationale(plan)
    assert plan["question_intent"]
    assert "Meta" in plan["why_this_question"] or "Meta" in rationale
    assert "redis" in rationale.lower() or "cache" in rationale.lower() or "redis" in str(plan["skill_coverage"])
