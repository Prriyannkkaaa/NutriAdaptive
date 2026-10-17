"""
Unit tests specifically verifying Feedback-Based Learning.
Confirms that user likes and dislikes measurably change future rankings,
suppress disliked recipes, and persist in SQLite.
"""

import pytest
import json
from pathlib import Path
from backend.app.ml.recommender import MealRecommender
from backend.app.database import engine, Base, SessionLocal
from backend.app.models import UserFeedback

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

@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()

def test_negative_feedback_suppresses_disliked_recipe(recommender, db_session, sample_recipes):
    """
    Test that disliking a recipe severely reduces its score and prevents it
    from being the top recommended meal.
    """
    user_id = "test-feedback-user-1"
    
    # Clear existing feedback for this test user
    db_session.query(UserFeedback).filter(UserFeedback.user_id == user_id).delete()
    db_session.commit()

    prefs = {
        "dietary_preference": "vegetarian",
        "allergies": [],
        "available_ingredients": ["wheat flour", "potato", "onion"],
        "daily_budget_inr": 200.0,
        "daily_calorie_target": 1800.0,
        "preferred_cuisines": ["North Indian"],
        "meal_categories": ["breakfast"]
    }

    # 1. First run without feedback
    plan1 = recommender.generate_meal_plan(prefs, db_session, user_id=user_id)
    first_choice = plan1["meal_plan"][0]
    first_choice_id = first_choice["id"]

    # 2. Add negative feedback for that recipe
    feedback = UserFeedback(
        user_id=user_id,
        recipe_id=first_choice_id,
        feedback_type="dislike"
    )
    db_session.add(feedback)
    db_session.commit()

    # 3. Next run with saved feedback
    plan2 = recommender.generate_meal_plan(prefs, db_session, user_id=user_id)
    second_choice = plan2["meal_plan"][0]

    # The disliked recipe must NOT be selected as top choice
    assert second_choice["id"] != first_choice_id

    # Check that score of the disliked item dropped drastically
    profile = recommender.get_learned_user_profile(user_id, db_session)
    assert first_choice_id in profile["disliked_ids"]

def test_positive_feedback_boosts_ranking(recommender, db_session, sample_recipes):
    """
    Test that liking a specific recipe increases its score in subsequent runs.
    """
    user_id = "test-feedback-user-2"
    db_session.query(UserFeedback).filter(UserFeedback.user_id == user_id).delete()
    db_session.commit()

    # Pick an eligible recipe from lunch
    lunch_candidates = [r for r in sample_recipes if r["meal_category"] == "lunch" and r["dietary_classification"] in {"vegetarian", "vegan"}]
    test_recipe = lunch_candidates[5]  # A middle-ranked candidate
    test_recipe_id = test_recipe["id"]

    prefs = {
        "dietary_preference": "vegetarian",
        "allergies": [],
        "available_ingredients": [],
        "daily_budget_inr": 300.0,
        "daily_calorie_target": 2000.0,
        "preferred_cuisines": ["North Indian", "South Indian", "Italian"],
        "meal_categories": ["lunch"]
    }

    # Score candidates before feedback
    profile_before = recommender.get_learned_user_profile(user_id, db_session)
    scored_before = recommender.score_recipes(
        candidate_recipes=lunch_candidates,
        all_recipes=sample_recipes,
        preferences=prefs,
        meal_category="lunch",
        target_calories_slot=800.0,
        target_budget_slot=120.0,
        learned_profile=profile_before
    )
    score_map_before = {r["id"]: s for r, s, _ in scored_before}
    initial_score = score_map_before[test_recipe_id]

    # Add Like feedback
    db_session.add(UserFeedback(
        user_id=user_id,
        recipe_id=test_recipe_id,
        feedback_type="like"
    ))
    db_session.commit()

    # Score candidates after feedback
    profile_after = recommender.get_learned_user_profile(user_id, db_session)
    scored_after = recommender.score_recipes(
        candidate_recipes=lunch_candidates,
        all_recipes=sample_recipes,
        preferences=prefs,
        meal_category="lunch",
        target_calories_slot=800.0,
        target_budget_slot=120.0,
        learned_profile=profile_after
    )
    score_map_after = {r["id"]: s for r, s, _ in scored_after}
    updated_score = score_map_after[test_recipe_id]

    assert updated_score > initial_score, f"Expected {updated_score} > {initial_score} after positive feedback"

def test_feedback_persistence_across_recommender_instances(db_session, sample_recipes):
    """
    Test that feedback stored in SQLite persists and affects recommendations
    even when creating a completely brand new recommender instance.
    """
    user_id = "test-persist-user"
    db_session.query(UserFeedback).filter(UserFeedback.user_id == user_id).delete()
    db_session.commit()

    # Add feedback directly to DB
    liked_recipe = sample_recipes[0]["id"]
    db_session.add(UserFeedback(user_id=user_id, recipe_id=liked_recipe, feedback_type="like"))
    db_session.commit()

    # Create fresh recommender instance
    new_engine = MealRecommender()
    new_engine.load_and_fit(sample_recipes)

    profile = new_engine.get_learned_user_profile(user_id, db_session)
    assert liked_recipe in profile["liked_ids"]
    assert profile["total_feedback_count"] == 1
