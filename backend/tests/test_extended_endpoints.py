from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_ok():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json().get("ok") is True


def test_professions_and_sectors_shape():
    assert client.get("/professions").status_code == 200
    assert client.get("/sectors").status_code == 200
    assert "professions" in client.get("/professions").json()
    assert "sectors" in client.get("/sectors").json()


def test_auth_me_with_bearer():
    reg = client.post(
        "/auth/register",
        json={
            "name": "Me Test",
            "email": f"me_{uuid4().hex[:8]}@example.com",
            "password": "secret123",
            "profession": "Frontend Developer",
        },
    )
    assert reg.status_code == 200
    data = reg.json()
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {data['access_token']}"})
    assert r.status_code == 200
    data = r.json()
    assert data["email"]
    assert data["profession"] == "Frontend Developer"


def test_quality_and_usage_guard_endpoints():
    reg = client.post(
        "/auth/register",
        json={
            "name": "Quality Test",
            "email": f"quality_{uuid4().hex[:8]}@example.com",
            "password": "secret123",
            "profession": "Frontend Developer",
        },
    )
    assert reg.status_code == 200
    auth = reg.json()
    headers = {
        "Authorization": f"Bearer {auth['access_token']}",
        "X-CSRF-Token": auth["csrf_token"],
    }

    seed = client.post("/demo/seed", headers=headers)
    assert seed.status_code == 200

    quality = client.get("/quality/questions", headers=headers)
    assert quality.status_code == 200
    payload = quality.json()
    assert payload["summary"]["questions_scanned"] >= 1
    assert "freshness_score" in payload["summary"]

    guards = client.get("/account/usage-guards", headers=headers)
    assert guards.status_code == 200
    assert guards.json()["status"] == "active"
    assert guards.json()["limits"]


def test_logout_clears_cookie():
    r = client.post("/auth/logout")
    assert r.status_code == 200
    assert r.json().get("ok") is True


def test_rag_eval_session_and_trend_endpoints():
    reg = client.post(
        "/auth/register",
        json={
            "name": "RAG Eval Test",
            "email": f"rageval_{uuid4().hex[:8]}@example.com",
            "password": "secret123",
            "profession": "Frontend Developer",
        },
    )
    assert reg.status_code == 200
    auth = reg.json()
    headers = {
        "Authorization": f"Bearer {auth['access_token']}",
        "X-CSRF-Token": auth["csrf_token"],
    }

    seed = client.post("/demo/seed", headers=headers)
    assert seed.status_code == 200

    sessions = client.get("/interview/sessions", headers=headers)
    assert sessions.status_code == 200
    session_id = sessions.json()["sessions"][0]["session_id"]

    session_eval = client.get(f"/rag/eval/session/{session_id}", headers=headers)
    assert session_eval.status_code == 200
    payload = session_eval.json()
    assert "retrieval_precision" in payload
    assert "coverage" in payload
    assert "faithfulness" in payload
    assert "citation_support_rate" in payload
    assert "low_confidence" in payload
    assert "rag_vs_no_rag" in payload

    trend = client.get("/rag/eval/trend?sample_size=10", headers=headers)
    assert trend.status_code == 200
    trend_payload = trend.json()
    assert "status" in trend_payload
    assert "timeline" in trend_payload
