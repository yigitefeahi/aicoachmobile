from __future__ import annotations

from typing import Any, Optional

from sqlalchemy.orm import Session

from .interview import enrich_config_with_memory, load_user_memory, normalize_config
from .knowledge_graph import build_graph_paths, graph_context_for_query, user_graph_edges
from .models import InterviewSession, User
from .rag import (
    RetrievalQuery,
    evaluate_retrieval,
    retrieve_for_evaluation,
    retrieve_for_question_generation,
)


def _rag_audit_from_result(phase: str, turn_index: int, question: str, result: Any, **extra: Any) -> dict[str, Any]:
    payload = {
        "phase": phase,
        "turn_index": turn_index,
        "question": question,
        "evidence": result.evidence,
        "retrieval_quality": result.quality,
        "rag_summary": result.summary,
        "query_trace": result.query_trace,
        "rag_evaluation": evaluate_retrieval(result.evidence),
    }
    payload.update(extra)
    return payload


def append_turn_rag_audit(session_json: dict[str, Any], audit: dict[str, Any]) -> list[dict[str, Any]]:
    audits = list(session_json.get("turn_rag_audits") or [])
    audits.append(audit)
    return audits[-30:]


def append_question_rag_history(session_json: dict[str, Any], entry: dict[str, Any]) -> list[dict[str, Any]]:
    history = list(session_json.get("question_rag_history") or [])
    history.append(entry)
    return history[-30:]


def _build_turn_traces(result_json: dict[str, Any], turns: list[dict[str, Any]]) -> list[dict[str, Any]]:
    stored = list(result_json.get("turn_rag_audits") or [])
    if stored:
        return stored
    final_summary = result_json.get("final_summary") or {}
    if turns and final_summary.get("retrieval_evidence"):
        latest = turns[-1]
        return [
            {
                "phase": "answer_evaluation",
                "turn_index": len(turns),
                "turn_id": latest.get("id"),
                "question": latest.get("question"),
                "answer_preview": str(latest.get("answer") or "")[:300],
                "evidence": final_summary.get("retrieval_evidence") or [],
                "retrieval_quality": final_summary.get("retrieval_quality") or {},
                "rag_summary": final_summary.get("rag_summary") or "",
                "query_trace": final_summary.get("rag_query_trace") or {},
                "rag_evaluation": final_summary.get("rag_evaluation") or {},
                "citations": final_summary.get("citations") or [],
            }
        ]
    return []


def build_inspector_payload(
    session: InterviewSession,
    user: User,
    db: Session,
    *,
    turn_index: Optional[int] = None,
    phase: str = "answer_evaluation",
) -> dict[str, Any]:
    result_json = session.result_json or {}
    final_summary = result_json.get("final_summary") or {}
    turns = list(result_json.get("turns") or [])
    config = normalize_config(result_json.get("config") or {})
    memories = load_user_memory(db, user)
    cv_facts = [
        item["content"]
        for item in memories
        if item.get("memory_type") in {"cv_signal", "skill_gap", "role_strength"}
    ][:8]

    turn_traces = _build_turn_traces(result_json, turns)
    selected_trace = None
    if turn_traces:
        if turn_index is not None:
            selected_trace = next((item for item in turn_traces if int(item.get("turn_index") or 0) == turn_index), None)
        if selected_trace is None:
            selected_trace = turn_traces[-1]

    latest = turns[-1] if turns else {}
    answer_text = str(selected_trace.get("answer_preview") or latest.get("answer") or "")
    feedback_text = str(final_summary.get("feedback") or latest.get("feedback") or "")
    question_text = str(selected_trace.get("question") or latest.get("question") or "")

    if phase == "question_generation":
        question_history = list(result_json.get("question_rag_history") or [])
        question_panel = question_history[-1] if question_history else (result_json.get("question_rag") or {})
        if turn_index is not None:
            question_panel = next(
                (item for item in question_history if int(item.get("turn_index") or 0) == turn_index),
                question_panel,
            )
        evidence = question_panel.get("evidence") or []
        query_trace = question_panel.get("query_trace") or {}
        rag_summary = question_panel.get("summary") or question_panel.get("rag_summary") or ""
        retrieval_quality = question_panel.get("quality") or question_panel.get("retrieval_quality") or {}
    else:
        question_panel = result_json.get("question_rag") or {}
        evidence = (selected_trace or {}).get("evidence") or final_summary.get("retrieval_evidence") or []
        query_trace = (selected_trace or {}).get("query_trace") or final_summary.get("rag_query_trace") or {}
        rag_summary = (selected_trace or {}).get("rag_summary") or final_summary.get("rag_summary") or result_json.get("question_rag", {}).get("summary")
        retrieval_quality = (selected_trace or {}).get("retrieval_quality") or final_summary.get("retrieval_quality") or {}

    graph_hits = graph_context_for_query(
        RetrievalQuery(
            purpose="inspector",
            profession=session.profession,
            query=" ".join([question_text, answer_text, feedback_text]),
            company=str(config.get("target_company") or config.get("company_pack") or ""),
            focus_area=str(config.get("focus_area") or ""),
            difficulty=str(config.get("difficulty") or ""),
            user_memory=memories,
            cv_facts=cv_facts,
        )
    )
    graph_paths = build_graph_paths(graph_hits, evidence)
    personal_edges = user_graph_edges(memories, cv_facts)
    rag_evaluation = (selected_trace or {}).get("rag_evaluation") or evaluate_retrieval(
        evidence,
        answer_text=answer_text,
        feedback_text=feedback_text,
    )
    citations = (selected_trace or {}).get("citations") or final_summary.get("citations") or []

    confidence_score = final_summary.get("confidence_score")
    if confidence_score is None and rag_evaluation.get("quality"):
        confidence_score = rag_evaluation["quality"].get("score")

    return {
        "session_id": session.id,
        "profession": session.profession,
        "selected_turn_index": (selected_trace or {}).get("turn_index") or (len(turns) if turns else None),
        "selected_phase": phase,
        "turn_traces": turn_traces,
        "question_rag_history": list(result_json.get("question_rag_history") or []),
        "query_debug": {
            "purpose": phase,
            "focus_area": config.get("focus_area"),
            "difficulty": config.get("difficulty"),
            "company": config.get("target_company") or config.get("company_pack"),
            "latest_question": question_text,
            "latest_answer_preview": answer_text[:300],
        },
        "query_trace": query_trace,
        "answer_rag": {
            "phase": "answer_evaluation",
            "evidence": (selected_trace or {}).get("evidence") or final_summary.get("retrieval_evidence") or [],
            "query_trace": (selected_trace or {}).get("query_trace") or final_summary.get("rag_query_trace") or {},
            "rag_summary": (selected_trace or {}).get("rag_summary") or final_summary.get("rag_summary") or "",
            "retrieval_quality": (selected_trace or {}).get("retrieval_quality") or final_summary.get("retrieval_quality") or {},
            "rag_evaluation": rag_evaluation,
            "citations": citations,
        },
        "question_rag": {
            "phase": "question_generation",
            "evidence": question_panel.get("evidence") or [],
            "query_trace": question_panel.get("query_trace") or {},
            "rag_summary": question_panel.get("summary") or question_panel.get("rag_summary") or "",
            "retrieval_quality": question_panel.get("quality") or question_panel.get("retrieval_quality") or {},
        },
        "retrieval_quality": retrieval_quality,
        "rag_summary": rag_summary,
        "retrieval_evaluation": rag_evaluation,
        "rag_confidence": {
            "score": confidence_score,
            "quality_label": (retrieval_quality or {}).get("label"),
            "quality_score": (retrieval_quality or {}).get("score"),
            "low_confidence": bool(rag_evaluation.get("low_confidence")),
        },
        "evidence": evidence,
        "citations": citations,
        "question_rag_raw": result_json.get("question_rag") or {},
        "graph_hits": graph_hits,
        "graph_paths": graph_paths,
        "user_graph_edges": personal_edges,
        "user_memory": memories,
        "low_confidence_warning": bool((retrieval_quality or {}).get("label") in {"none", "low"} or rag_evaluation.get("low_confidence")),
    }


def rerun_session_retrieval(
    session: InterviewSession,
    user: User,
    db: Session,
    *,
    turn_index: Optional[int] = None,
    phase: str = "answer_evaluation",
) -> dict[str, Any]:
    result_json = session.result_json or {}
    config = normalize_config(result_json.get("config") or {})
    enriched = enrich_config_with_memory(db, user, config)
    turns = list(result_json.get("turns") or [])

    if phase == "question_generation":
        history = list(result_json.get("question_rag_history") or [])
        entry = None
        if turn_index is not None:
            entry = next((item for item in history if int(item.get("turn_index") or 0) == turn_index), None)
        question = str((entry or {}).get("question") or result_json.get("current_question") or "")
        idx = int((entry or {}).get("turn_index") or turn_index or 1)
        result = retrieve_for_question_generation(
            profession=session.profession,
            config=enriched,
            asked_topics=list(result_json.get("asked_topics") or []),
            asked_questions=[str(item.get("question") or "") for item in turns if item.get("question")],
        )
        return {
            "session_id": session.id,
            "phase": phase,
            "turn_index": idx,
            "question": question,
            "query_trace": result.query_trace,
            "evidence": result.evidence,
            "retrieval_quality": result.quality,
            "rag_summary": result.summary,
            "rag_evaluation": evaluate_retrieval(result.evidence),
            "rerun": True,
        }

    if not turns:
        raise ValueError("No turns available for answer retrieval rerun")

    idx = turn_index if turn_index is not None else len(turns)
    turn = turns[min(max(idx, 1), len(turns)) - 1]
    question = str(turn.get("question") or "")
    answer = str(turn.get("answer") or "")
    result = retrieve_for_evaluation(
        profession=session.profession,
        question=question,
        answer_text=answer,
        config=enriched,
    )
    return {
        "session_id": session.id,
        "phase": phase,
        "turn_index": idx,
        "question": question,
        "answer_preview": answer[:300],
        "query_trace": result.query_trace,
        "evidence": result.evidence,
        "retrieval_quality": result.quality,
        "rag_summary": result.summary,
        "rag_evaluation": evaluate_retrieval(result.evidence, answer_text=answer),
        "rerun": True,
    }
