"""
Recommendations API router.
"""

import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import UserPreference, MealPlanRecord, Recipe
from backend.app.schemas import RecommendationRequest, MealPlanResponse
from backend.app.ml.recommender import recommender_engine

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])

@router.post("", response_model=MealPlanResponse)
def get_recommendations(req: RecommendationRequest, db: Session = Depends(get_db)):
    """
    Generate a personalized daily meal plan based on preferences and accumulated feedback.
    Optionally accepts updated preferences or retrieves saved preferences for the user.
    """
    user_id = req.user_id or "demo-user"

    # Ensure recommender is initialized with dataset
    if not recommender_engine.cached_recipes:
        recipes = db.query(Recipe).all()
        recommender_engine.load_and_fit([r.to_dict() for r in recipes])

    # Determine preferences
    if req.preferences:
        pref_dict = req.preferences.model_dump()
    else:
        saved_pref = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
        if saved_pref:
            pref_dict = saved_pref.to_dict()
        else:
            pref_dict = {
                "user_id": user_id,
                "age": 25,
                "dietary_preference": "vegetarian",
                "allergies": [],
                "available_ingredients": ["paneer", "rice", "tomato", "wheat flour", "ghee", "onion"],
                "daily_budget_inr": 220.0,
                "daily_calorie_target": 1800.0,
                "preferred_cuisines": ["North Indian", "South Indian", "Italian"],
                "meal_categories": ["breakfast", "lunch", "dinner"]
            }

    # Generate plan via ML Recommender Engine
    result = recommender_engine.generate_meal_plan(
        preferences=pref_dict,
        db=db,
        user_id=user_id,
        exclude_recipe_ids=req.exclude_recipe_ids
    )

    # Persist the generated meal plan record in SQLite history
    plan_record = MealPlanRecord(
        user_id=user_id,
        recipe_ids_json=json.dumps([m["id"] for m in result["meal_plan"]]),
        total_calories=result["total_calories"],
        total_cost_inr=result["total_cost_inr"],
        total_protein=result["total_protein"],
        total_carbs=result["total_carbs"],
        total_fat=result["total_fat"],
        explanations_json=json.dumps(result["explanations"])
    )
    db.add(plan_record)
    db.commit()

    return MealPlanResponse(**result)

@router.get("/history")
def get_recommendations_history(user_id: str = "demo-user", limit: int = 10, db: Session = Depends(get_db)):
    """Retrieve history of previously generated meal plans for a user."""
    records = (
        db.query(MealPlanRecord)
        .filter(MealPlanRecord.user_id == user_id)
        .order_by(MealPlanRecord.created_at.desc())
        .limit(limit)
        .all()
    )

    # Recipe dictionary for hydration
    recipes_lookup = {r.id: r.to_dict() for r in db.query(Recipe).all()}

    history_list = []
    for rec in records:
        rec_dict = rec.to_dict()
        # Hydrate recipes
        meals = [recipes_lookup[rid] for rid in rec_dict["recipe_ids"] if rid in recipes_lookup]
        rec_dict["meals"] = meals
        history_list.append(rec_dict)

    return {"user_id": user_id, "total_records": len(history_list), "history": history_list}
