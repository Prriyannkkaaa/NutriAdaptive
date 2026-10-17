"""
User feedback API router for rating meals (Like / Dislike) and updating learned preferences.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import UserFeedback, Recipe
from backend.app.schemas import FeedbackInput, FeedbackResponse, FeedbackHistoryResponse
from backend.app.ml.recommender import recommender_engine

router = APIRouter(prefix="/api/feedback", tags=["Feedback"])

@router.post("", response_model=FeedbackResponse)
def submit_feedback(fb_in: FeedbackInput, db: Session = Depends(get_db)):
    """
    Submit a Like or Dislike for a specific recipe.
    Persists feedback in SQLite and dynamically updates user's learned profile.
    """
    recipe = db.query(Recipe).filter(Recipe.id == fb_in.recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail=f"Recipe '{fb_in.recipe_id}' does not exist.")

    # Check if existing feedback from this user for this recipe exists
    existing = (
        db.query(UserFeedback)
        .filter(UserFeedback.user_id == fb_in.user_id, UserFeedback.recipe_id == fb_in.recipe_id)
        .first()
    )

    if existing:
        existing.feedback_type = fb_in.feedback_type
        db_fb = existing
    else:
        db_fb = UserFeedback(
            user_id=fb_in.user_id,
            recipe_id=fb_in.recipe_id,
            feedback_type=fb_in.feedback_type
        )
        db.add(db_fb)

    db.commit()
    db.refresh(db_fb)

    return FeedbackResponse(**db_fb.to_dict())

@router.get("/history", response_model=FeedbackHistoryResponse)
def get_feedback_history(user_id: str = "demo-user", db: Session = Depends(get_db)):
    """
    Retrieve all historical like and dislike ratings for the user,
    along with the dynamic learned affinity summary across cuisines and ingredients.
    """
    feedbacks = (
        db.query(UserFeedback)
        .filter(UserFeedback.user_id == user_id)
        .order_by(UserFeedback.timestamp.desc())
        .all()
    )

    likes = [f for f in feedbacks if f.feedback_type == "like"]
    dislikes = [f for f in feedbacks if f.feedback_type == "dislike"]

    # Retrieve learned profile summary
    learned_profile = recommender_engine.get_learned_user_profile(user_id, db)

    return FeedbackHistoryResponse(
        user_id=user_id,
        total_likes=len(likes),
        total_dislikes=len(dislikes),
        history=[FeedbackResponse(**f.to_dict()) for f in feedbacks],
        learned_affinity_summary={
            "cuisine_affinity": learned_profile.get("cuisine_affinity", {}),
            "top_liked_ingredients": sorted(
                [k for k, v in learned_profile.get("ingredient_affinity", {}).items() if v > 0],
                key=lambda k: learned_profile["ingredient_affinity"][k],
                reverse=True
            )[:10],
            "top_disliked_ingredients": sorted(
                [k for k, v in learned_profile.get("ingredient_affinity", {}).items() if v < 0],
                key=lambda k: learned_profile["ingredient_affinity"][k]
            )[:10],
        }
    )

@router.delete("/reset")
def reset_feedback(user_id: str = "demo-user", db: Session = Depends(get_db)):
    """Reset all feedback ratings for a user (useful for live demonstrations)."""
    deleted_count = db.query(UserFeedback).filter(UserFeedback.user_id == user_id).delete()
    db.commit()
    return {"message": f"Successfully cleared {deleted_count} feedback records for {user_id}."}
