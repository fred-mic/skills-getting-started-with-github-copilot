from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_duplicate_and_capacity_and_unregister():
    # Use a temporary activity created for testing to avoid interfering with in-memory data
    test_activity = "Test Activity"
    activities[test_activity] = {
        "description": "Test activity",
        "schedule": "Now",
        "max_participants": 2,
        "participants": []
    }

    # signup first participant
    resp = client.post(f"/activities/{test_activity}/signup?email=alice@example.com")
    assert resp.status_code == 200
    assert "Signed up alice@example.com" in resp.json()["message"]
    assert "alice@example.com" in activities[test_activity]["participants"]

    # duplicate signup should fail
    resp = client.post(f"/activities/{test_activity}/signup?email=alice@example.com")
    assert resp.status_code == 400

    # signup second participant (fills capacity)
    resp = client.post(f"/activities/{test_activity}/signup?email=bob@example.com")
    assert resp.status_code == 200

    # signup third participant should fail (capacity)
    resp = client.post(f"/activities/{test_activity}/signup?email=carol@example.com")
    assert resp.status_code == 400

    # unregister one participant
    resp = client.delete(f"/activities/{test_activity}/participants?email=alice@example.com")
    assert resp.status_code == 200
    assert "alice@example.com" not in activities[test_activity]["participants"]

    # cleanup
    del activities[test_activity]
