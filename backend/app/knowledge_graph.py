from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Any, Optional

from .product_features import COMPANY_PACKS
from .role_profiles import ROLE_INTERVIEW_PROFILES


_GRAPH_JSON = Path(__file__).resolve().parent.parent / "data" / "rag" / "graph" / "interview_graph.json"


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", (value or "").lower()).strip("_")


def _tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-zA-Z0-9_]+", (text or "").lower()))


def _edge_key(edge: dict[str, str]) -> tuple[str, str, str]:
    return (
        str(edge.get("source") or ""),
        str(edge.get("relation") or ""),
        str(edge.get("target") or ""),
    )


def _dedupe_edges(edges: list[dict[str, str]]) -> list[dict[str, str]]:
    seen: set[tuple[str, str, str]] = set()
    out: list[dict[str, str]] = []
    for edge in edges:
        key = _edge_key(edge)
        if not key[0] or not key[1] or not key[2] or key in seen:
            continue
        seen.add(key)
        out.append(edge)
    return out


def load_curated_edges() -> list[dict[str, str]]:
    if not _GRAPH_JSON.exists():
        return []
    try:
        payload = json.loads(_GRAPH_JSON.read_text(encoding="utf-8"))
    except Exception:
        return []
    rows = payload.get("edges") if isinstance(payload, dict) else payload
    if not isinstance(rows, list):
        return []
    return [
        {
            "source": _slug(str(item.get("source") or "")),
            "relation": _slug(str(item.get("relation") or "")),
            "target": _slug(str(item.get("target") or "")),
            "origin": str(item.get("origin") or "curated"),
        }
        for item in rows
        if isinstance(item, dict)
    ]


def generate_role_edges() -> list[dict[str, str]]:
    edges: list[dict[str, str]] = []
    for profession, profile in ROLE_INTERVIEW_PROFILES.items():
        role_slug = _slug(profession)
        for theme in profile.get("themes", [])[:6]:
            edges.append(
                {
                    "source": role_slug,
                    "relation": "requires",
                    "target": _slug(str(theme)),
                    "origin": "role_profile",
                }
            )
        for focus in profile.get("evaluation_focus", [])[:5]:
            target = _slug(str(focus))
            edges.append(
                {
                    "source": role_slug,
                    "relation": "evaluated_by",
                    "target": target,
                    "origin": "role_profile",
                }
            )
    return edges


def generate_company_edges() -> list[dict[str, str]]:
    edges: list[dict[str, str]] = []
    for company_id, pack in COMPANY_PACKS.items():
        for focus in pack.get("rubric_focus", []):
            edges.append(
                {
                    "source": company_id,
                    "relation": "values",
                    "target": _slug(str(focus)),
                    "origin": "company_pack",
                }
            )
        for style in pack.get("question_styles", []):
            edges.append(
                {
                    "source": company_id,
                    "relation": "prefers",
                    "target": _slug(str(style)),
                    "origin": "company_pack",
                }
            )
    return edges


def generate_skill_edges() -> list[dict[str, str]]:
    from .question_planner import SKILL_SIGNALS

    edges: list[dict[str, str]] = []
    for skill in SKILL_SIGNALS:
        edges.append(
            {
                "source": skill,
                "relation": "evaluated_by",
                "target": "technical_depth",
                "origin": "skill_taxonomy",
            }
        )
    return edges


@lru_cache(maxsize=1)
def get_all_graph_edges() -> tuple[dict[str, str], ...]:
    merged = _dedupe_edges(
        load_curated_edges()
        + generate_role_edges()
        + generate_company_edges()
        + generate_skill_edges()
    )
    return tuple(merged)


def user_graph_edges(
    user_memory: Optional[list[dict[str, Any]]] = None,
    cv_facts: Optional[list[str]] = None,
) -> list[dict[str, str]]:
    from .question_planner import extract_skills_from_text

    edges: list[dict[str, str]] = []
    for item in user_memory or []:
        memory_type = str(item.get("memory_type") or "").strip()
        content = str(item.get("content") or "")
        meta = item.get("meta") if isinstance(item.get("meta"), dict) else {}
        dimensions = [str(dim) for dim in (meta.get("dimensions") or []) if str(dim).strip()]
        if memory_type in {"weakness_pattern", "skill_gap"}:
            relation = "weak_in"
            targets = list(dimensions)
            if not targets:
                lowered = content.lower()
                for dim in [
                    "metrics",
                    "structure",
                    "technical_depth",
                    "tradeoffs",
                    "validation",
                    "ownership",
                    "impact",
                    "communication",
                ]:
                    if dim.replace("_", " ") in lowered or dim in lowered:
                        targets.append(dim)
            if not targets:
                targets = [_slug(part) for part in re.findall(r"[a-zA-Z_]{4,}", content.lower())[:2]]
            for target in targets[:3]:
                if target:
                    edges.append(
                        {
                            "source": "user",
                            "relation": relation,
                            "target": _slug(target),
                            "origin": "user_memory",
                        }
                    )
        elif memory_type == "strength_pattern":
            for target in dimensions[:2]:
                edges.append(
                    {
                        "source": "user",
                        "relation": "strong_in",
                        "target": _slug(target),
                        "origin": "user_memory",
                    }
                )
        elif memory_type == "cv_signal":
            for skill in extract_skills_from_text(content):
                edges.append(
                    {
                        "source": "cv",
                        "relation": "contains",
                        "target": skill,
                        "origin": "cv_signal",
                    }
                )
    for fact in cv_facts or []:
        for skill in extract_skills_from_text(str(fact)):
            edges.append(
                {
                    "source": "cv",
                    "relation": "contains",
                    "target": skill,
                    "origin": "cv_fact",
                }
            )
    return _dedupe_edges(edges)


def _query_tokens_from_payload(payload: Any) -> set[str]:
    parts = [
        getattr(payload, "query", "") or "",
        getattr(payload, "profession", "") or "",
        getattr(payload, "company", "") or "",
        getattr(payload, "focus_area", "") or "",
        getattr(payload, "difficulty", "") or "",
        " ".join(getattr(payload, "cv_facts", []) or []),
    ]
    user_memory = getattr(payload, "user_memory", None) or []
    for item in user_memory:
        parts.append(str(item.get("memory_type", "")))
        parts.append(str(item.get("content", "")))
        meta = item.get("meta") if isinstance(item.get("meta"), dict) else {}
        for dim in meta.get("dimensions") or []:
            parts.append(str(dim))
    return _tokenize(" ".join(parts))


def graph_context_for_query(payload: Any, extra_edges: Optional[list[dict[str, str]]] = None) -> list[dict[str, Any]]:
    tokens = _query_tokens_from_payload(payload)
    profession_slug = _slug(getattr(payload, "profession", "") or "")
    company_slug = _slug(getattr(payload, "company", "") or "")

    all_edges = list(get_all_graph_edges()) + list(extra_edges or []) + user_graph_edges(
        getattr(payload, "user_memory", None),
        getattr(payload, "cv_facts", None),
    )

    hits: list[dict[str, Any]] = []
    for edge in all_edges:
        edge_text = " ".join(edge.values())
        edge_tokens = _tokenize(edge_text) | _tokenize(edge_text.replace("_", " "))
        overlap = len(tokens & edge_tokens)
        if edge.get("source") == profession_slug or edge.get("source") == company_slug:
            overlap += 2
        if edge.get("source") in {"user", "cv"}:
            overlap += 1
        if overlap:
            hits.append({**edge, "overlap": overlap})
    hits.sort(key=lambda item: item["overlap"], reverse=True)
    return hits[:10]


def build_graph_paths(
    graph_hits: list[dict[str, Any]],
    evidence: Optional[list[dict[str, Any]]] = None,
) -> list[dict[str, Any]]:
    evidence = evidence or []
    paths: list[dict[str, Any]] = []
    for edge in graph_hits[:8]:
        target_tokens = _tokenize(str(edge.get("target") or "").replace("_", " "))
        source_tokens = _tokenize(str(edge.get("source") or "").replace("_", " "))
        linked_chunks: list[dict[str, Any]] = []
        for item in evidence:
            content_tokens = _tokenize(str(item.get("content") or ""))
            if target_tokens & content_tokens or source_tokens & content_tokens:
                linked_chunks.append(
                    {
                        "source": item.get("source"),
                        "layer": item.get("layer"),
                        "doc_type": item.get("doc_type"),
                        "preview": item.get("preview") or str(item.get("content") or "")[:180],
                        "hybrid_score": item.get("hybrid_score"),
                    }
                )
        paths.append(
            {
                "path_label": f"{edge.get('source')} → {edge.get('relation')} → {edge.get('target')}",
                "edge": edge,
                "kb_chunks": linked_chunks[:3],
                "hop": 1,
            }
        )
    return paths


def planner_graph_context(
    *,
    profession: str,
    company: str = "",
    skill_gaps: Optional[list[str]] = None,
    user_memory: Optional[list[dict[str, Any]]] = None,
    cv_facts: Optional[list[str]] = None,
) -> list[dict[str, Any]]:
    from types import SimpleNamespace

    payload = SimpleNamespace(
        query=" ".join(
            [
                profession,
                company,
                " ".join(skill_gaps or []),
                " ".join(cv_facts or []),
            ]
        ),
        profession=profession,
        company=company,
        focus_area="",
        difficulty="",
        cv_facts=cv_facts or [],
        user_memory=user_memory or [],
    )
    return graph_context_for_query(payload)


def format_planner_graph_rationale(graph_hits: list[dict[str, Any]]) -> str:
    if not graph_hits:
        return ""
    labels: list[str] = []
    for edge in graph_hits[:3]:
        labels.append(
            f"{edge.get('source', '').replace('_', ' ')} {edge.get('relation', '').replace('_', ' ')} "
            f"{edge.get('target', '').replace('_', ' ')}"
        )
    return f"Knowledge graph path: {'; '.join(labels)}."


def graph_expansion_targets(graph_hits: list[dict[str, Any]], limit: int = 3) -> list[dict[str, Any]]:
    targets: list[dict[str, Any]] = []
    seen: set[str] = set()
    for edge in graph_hits:
        target = str(edge.get("target") or "").strip()
        if not target or target in seen:
            continue
        seen.add(target)
        targets.append(edge)
        if len(targets) >= limit:
            break
    return targets
