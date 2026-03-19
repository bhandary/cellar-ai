from fastapi.testclient import TestClient

from backend.app.graph import build_turn, chunk_text
from backend.app.main import app

client = TestClient(app)


def test_build_turn_includes_all_tool_layers():
    turn = build_turn([{"role": "user", "content": "Recommend a Burgundy for roast chicken"}])
    assert len(turn.tool_signals) == 4
    assert {tool.name for tool in turn.tool_signals} == {"wine_lookup", "food_pairing", "price_check", "cellar_advice"}


def test_chunk_text_preserves_order():
    assert "".join(chunk_text("cellar ai streams cleanly")) == "cellar ai streams cleanly"


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["provider_mode"] == "mock"


def test_run_endpoint_returns_stream_batch():
    payload = {
        "threadId": "thread-1",
        "runId": "run-1",
        "messages": [{"id": "m1", "role": "user", "content": "Compare a Rioja and Napa red"}],
        "tools": [],
        "context": [],
    }
    response = client.post("/run", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert any(event["type"] == "TOOL_CALL_RESULT" for event in data["events"])
    assert any(event["type"] == "STATE_SNAPSHOT" for event in data["events"])


def test_run_sse_streams_events():
    payload = {
        "threadId": "thread-2",
        "runId": "run-2",
        "messages": [{"id": "m1", "role": "user", "content": "Need cellar advice for Rioja"}],
        "tools": [],
        "context": [],
    }
    with client.stream("POST", "/run_sse", json=payload) as response:
        body = "".join(part if isinstance(part, str) else part.decode() for part in response.iter_text())

    assert response.status_code == 200
    assert '"type": "RUN_STARTED"' in body
    assert '"type": "TOOL_CALL_START"' in body
    assert '"type": "TEXT_MESSAGE_CONTENT"' in body
    assert '"type": "RUN_FINISHED"' in body
