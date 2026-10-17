"""
User preferences API router.
"""

import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import UserPreference
from backend.app.schemas import UserPreferenceInput, UserPreferenceResponse

router = APIRouter(prefix="/api/preferences", tags=["Preferences"])

@router.post("", response_model=UserPreferenceResponse)
def save_preferences(pref_in: UserPreferenceInput, db: Session = Depends(get_db)):
    """Save or update user personal preferences, calorie targets, and dietary limits."""
    user_id = pref_in.user_id or "demo-user"
    existing = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()

    if existing:
        existing.age = pref_in.age
        existing.dietary_preference = pref_in.dietary_preference
        existing.allergies_json = json.dumps(pref_in.allergies)
        existing.available_ingredients_json = json.dumps(pref_in.available_ingredients)
        existing.daily_budget_inr = pref_in.daily_budget_inr
        existing.daily_calorie_target = pref_in.daily_calorie_target
        existing.preferred_cuisines_json = json.dumps(pref_in.preferred_cuisines)
        existing.meal_categories_json = json.dumps(pref_in.meal_categories)
        pref_obj = existing
    else:
        pref_obj = UserPreference(
            user_id=user_id,
            age=pref_in.age,
            dietary_preference=pref_in.dietary_preference,
            allergies_json=json.dumps(pref_in.allergies),
            available_ingredients_json=json.dumps(pref_in.available_ingredients),
            daily_budget_inr=pref_in.daily_budget_inr,
            daily_calorie_target=pref_in.daily_calorie_target,
            preferred_cuisines_json=json.dumps(pref_in.preferred_cuisines),
            meal_categories_json=json.dumps(pref_in.meal_categories),
        )
        db.add(pref_obj)

    db.commit()
    db.refresh(pref_obj)
    return UserPreferenceResponse(**pref_obj.to_dict())

@router.get("", response_model=UserPreferenceResponse)
def get_preferences(user_id: str = "demo-user", db: Session = Depends(get_db)):
    """Retrieve saved preferences for a specific user ID."""
    existing = db.query(UserPreference).filter(UserPreference.user_id == user_id).first()
    if not existing:
        # Default fallback preference
        return UserPreferenceResponse(
            user_id=user_id,
            age=25,
            dietary_preference="vegetarian",
            allergies=[],
            available_ingredients=["paneer", "rice", "tomato", "wheat flour", "ghee", "onion"],
            daily_budget_inr=220.0,
            daily_calorie_target=1800.0,
            preferred_cuisines=["North Indian", "South Indian", "Italian"],
            meal_categories=["breakfast", "lunch", "dinner"]
        )
    return UserPreferenceResponse(**existing.to_dict())
