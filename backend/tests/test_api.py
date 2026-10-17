"""
FastAPI REST API integration tests using TestClient.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import engine, Base, SessionLocal
from backend.app.models import UserFeedback

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["recipe_count"] >= 200

def test_recipes_endpoints():
    # List recipes
    resp = client.get("/api/recipes?limit=10")
    assert resp.status_code == 200
    recipes = resp.json()
    assert len(recipes) == 10

    # Filter by category
    resp_b = client.get("/api/recipes?category=breakfast&limit=5")
    assert resp_b.status_code == 200
    for r in resp_b.json():
        assert r["meal_category"] == "breakfast"

    # Get single recipe
    recipe_id = recipes[0]["id"]
    resp_single = client.get(f"/api/recipes/{recipe_id}")
    assert resp_single.status_code == 200
    assert resp_single.json()["id"] == recipe_id

def test_preferences_save_and_retrieve():
    test_user = "api-test-user"
    payload = {
        "user_id": test_user,
        "age": 28,
        "dietary_preference": "vegetarian",
        "allergies": ["peanuts"],
        "available_ingredients": ["paneer", "spinach", "garlic"],
        "daily_budget_inr": 350.0,
        "daily_calorie_target": 2200.0,
        "preferred_cuisines": ["North Indian", "Italian"],
        "meal_categories": ["breakfast", "lunch", "dinner"]
    }
    resp = client.post("/api/preferences", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["user_id"] == test_user
    assert data["daily_budget_inr"] == 350.0

    # Retrieve
    get_resp = client.get(f"/api/preferences?user_id={test_user}")
    assert get_resp.status_code == 200
    assert get_resp.json()["age"] == 28

def test_preferences_validation_errors():
    # Invalid dietary preference
    invalid_payload = {
        "user_id": "bad-user",
        "age": 25,
        "dietary_preference": "fruitarian-invalid",
        "daily_budget_inr": 200.0,
        "daily_calorie_target": 1800.0,
        "meal_categories": ["breakfast"]
    }
    resp = client.post("/api/preferences", json=invalid_payload)
    assert resp.status_code == 422

    # Negative budget
    neg_budget_payload = {
        "user_id": "bad-user",
        "age": 25,
        "dietary_preference": "vegetarian",
        "daily_budget_inr": -50.0,
        "daily_calorie_target": 1800.0,
        "meal_categories": ["breakfast"]
    }
    resp2 = client.post("/api/preferences", json=neg_budget_payload)
    assert resp2.status_code == 422

def test_recommendation_and_feedback_flow():
    user_id = "flow-test-user"

    # 1. Request recommendations
    rec_payload = {
        "user_id": user_id,
        "preferences": {
            "user_id": user_id,
            "age": 22,
            "dietary_preference": "vegan",
            "allergies": ["gluten"],
            "available_ingredients": ["poha", "mustard seeds", "onion"],
            "daily_budget_inr": 200.0,
            "daily_calorie_target": 1600.0,
            "preferred_cuisines": ["Indian", "South Indian"],
            "meal_categories": ["breakfast", "lunch", "dinner"]
        }
    }
    resp = client.post("/api/recommendations", json=rec_payload)
    assert resp.status_code == 200
    plan = resp.json()
    assert len(plan["meal_plan"]) == 3
    for meal in plan["meal_plan"]:
        assert meal["dietary_classification"] == "vegan"
        assert "gluten" not in meal.get("allergens", [])

    # 2. Submit a like for the first meal
    first_meal = plan["meal_plan"][0]
    fb_payload = {
        "user_id": user_id,
        "recipe_id": first_meal["id"],
        "feedback_type": "like"
    }
    fb_resp = client.post("/api/feedback", json=fb_payload)
    assert fb_resp.status_code == 200
    assert fb_resp.json()["feedback_type"] == "like"

    # 3. Retrieve feedback history
    hist_resp = client.get(f"/api/feedback/history?user_id={user_id}")
    assert hist_resp.status_code == 200
    assert hist_resp.json()["total_likes"] >= 1

    # 4. Check recommendation history
    rec_hist_resp = client.get(f"/api/recommendations/history?user_id={user_id}")
    assert rec_hist_resp.status_code == 200
    assert rec_hist_resp.json()["total_records"] >= 1
