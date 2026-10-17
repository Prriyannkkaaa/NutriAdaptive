"""
Unit tests for the ML Recommendation Engine.
Tests hard constraint filtering, ingredient overlap, calorie and budget scoring,
and full meal plan generation.
"""

import pytest
import json
from pathlib import Path
from backend.app.ml.recommender import MealRecommender
from backend.app.ml.features import FeatureExtractor
from backend.app.database import engine, Base, SessionLocal
from backend.app.models import Recipe, UserPreference, UserFeedback

@pytest.fixture(scope="module")
def sample_recipes():
    json_path = Path(__file__).resolve().parent.parent / "app" / "data" / "recipes.json"
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)

@pytest.fixture(scope="module")
def recommender(sample_recipes):
    engine_inst = MealRecommender()
    engine_inst.load_and_fit(sample_recipes)
    return engine_inst

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()

def test_hard_constraint_vegan(recommender, sample_recipes):
    """Ensure vegan preference only selects vegan recipes."""
    filtered = recommender.filter_hard_constraints(
        recipes=sample_recipes,
        dietary_preference="vegan",
        allergies=[],
        meal_category="breakfast"
    )
    assert len(filtered) > 0
    for r in filtered:
        assert r["dietary_classification"] == "vegan"
        assert r["meal_category"] == "breakfast"

def test_hard_constraint_vegetarian(recommender, sample_recipes):
    """Ensure vegetarian preference excludes non-veg and eggetarian recipes."""
    filtered = recommender.filter_hard_constraints(
        recipes=sample_recipes,
        dietary_preference="vegetarian",
        allergies=[],
        meal_category="lunch"
    )
    assert len(filtered) > 0
    for r in filtered:
        assert r["dietary_classification"] in {"vegetarian", "vegan"}
        assert r["meal_category"] == "lunch"

def test_hard_constraint_allergy_dairy(recommender, sample_recipes):
    """Ensure dairy allergy excludes recipes containing milk, paneer, curd, ghee, etc."""
    filtered = recommender.filter_hard_constraints(
        recipes=sample_recipes,
        dietary_preference="vegetarian",
        allergies=["dairy"],
        meal_category="dinner"
    )
    for r in filtered:
        assert "dairy" not in [a.lower() for a in r.get("allergens", [])]
        tokens = {t.lower() for t in r.get("ingredient_tokens", [])}
        assert not {"paneer", "milk", "curd", "ghee", "cheese", "cream"}.intersection(tokens)

def test_hard_constraint_allergy_peanuts(recommender, sample_recipes):
    """Ensure peanut allergy excludes peanut-containing items."""
    filtered = recommender.filter_hard_constraints(
        recipes=sample_recipes,
        dietary_preference="vegetarian",
        allergies=["peanuts"],
        meal_category="breakfast"
    )
    for r in filtered:
        assert "peanuts" not in [a.lower() for a in r.get("allergens", [])]
        tokens = {t.lower() for t in r.get("ingredient_tokens", [])}
        assert "peanuts" not in tokens

def test_ingredient_similarity_scoring(recommender, sample_recipes):
    """Ensure recipes with matching ingredients receive higher ingredient compatibility scores."""
    user_pantry = ["poha", "peanuts", "mustard seeds", "onion"]
    sims = recommender.feature_extractor.compute_ingredient_similarity(user_pantry, sample_recipes)
    
    # Find poha recipe index
    poha_idx = next(i for i, r in enumerate(sample_recipes) if "poha" in r["name"].lower())
    pizza_or_pasta_idx = next(i for i, r in enumerate(sample_recipes) if "pasta" in r["name"].lower())
    
    assert sims[poha_idx] > sims[pizza_or_pasta_idx]

def test_meal_plan_generation_success(recommender, db_session):
    """Test full meal plan generation with realistic budget and calorie targets."""
    prefs = {
        "dietary_preference": "vegetarian",
        "allergies": [],
        "available_ingredients": ["paneer", "rice", "tomato", "wheat flour", "ghee"],
        "daily_budget_inr": 250.0,
        "daily_calorie_target": 1800.0,
        "preferred_cuisines": ["North Indian", "South Indian"],
        "meal_categories": ["breakfast", "lunch", "dinner"]
    }
    plan = recommender.generate_meal_plan(prefs, db_session, user_id="test-plan-user")
    
    assert len(plan["meal_plan"]) == 3
    categories_chosen = [m["meal_category"] for m in plan["meal_plan"]]
    assert "breakfast" in categories_chosen
    assert "lunch" in categories_chosen
    assert "dinner" in categories_chosen
    assert plan["total_calories"] > 0
    assert plan["total_cost_inr"] > 0
    assert len(plan["explanations"]) == 3

def test_meal_plan_unmet_budget_warning(recommender, db_session):
    """Test that extremely low budget emits an explanatory warning without crashing."""
    prefs = {
        "dietary_preference": "vegetarian",
        "allergies": [],
        "available_ingredients": [],
        "daily_budget_inr": 30.0,  # Unrealistic 30 INR for 3 meals
        "daily_calorie_target": 1800.0,
        "preferred_cuisines": ["Indian"],
        "meal_categories": ["breakfast", "lunch", "dinner"]
    }
    plan = recommender.generate_meal_plan(prefs, db_session, user_id="test-cheap-user")
    assert plan["budget_status"] == "exceeded_budget"
    assert any("exceeds daily budget" in w.lower() for w in plan["warnings"])
