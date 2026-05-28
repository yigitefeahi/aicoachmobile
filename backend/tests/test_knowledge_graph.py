from app import knowledge_graph as kg


def test_graph_has_more_than_curated_edges():
    edges = kg.get_all_graph_edges()
    assert len(edges) > 20
    origins = {edge.get("origin") for edge in edges}
    assert "role_profile" in origins
    assert "company_pack" in origins


def test_user_graph_edges_from_memory_and_cv():
    edges = kg.user_graph_edges(
        user_memory=[
            {
                "memory_type": "skill_gap",
                "content": "Needs stronger metrics in answers.",
                "meta": {"dimensions": ["metrics"]},
            },
            {
                "memory_type": "cv_signal",
                "content": "Built Redis cache layer for API latency reduction.",
            },
        ],
        cv_facts=["Used Redis and PostgreSQL in production."],
    )
    relations = {(e["source"], e["relation"], e["target"]) for e in edges}
    assert ("user", "weak_in", "metrics") in relations
    assert any(source == "cv" and relation == "contains" and target == "redis" for source, relation, target in relations)


def test_build_graph_paths_links_kb_chunks():
    graph_hits = [
        {"source": "backend_developer", "relation": "requires", "target": "api_design", "overlap": 3},
    ]
    evidence = [
        {
            "source": "backend.md",
            "layer": "role_kb",
            "doc_type": "role",
            "content": "Backend candidates should explain APIs and reliability.",
            "preview": "Backend candidates should explain APIs",
            "hybrid_score": 0.8,
        }
    ]
    paths = kg.build_graph_paths(graph_hits, evidence)
    assert paths
    assert paths[0]["path_label"]
    assert paths[0]["kb_chunks"]
