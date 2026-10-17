"""
SQLAlchemy database models for recipes, user preferences, feedback, and meal plans.
"""

import json
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    cuisine = Column(String(100), nullable=False, index=True)
    meal_category = Column(String(50), nullable=False, index=True)  # breakfast, lunch, snacks, dinner
    dietary_classification = Column(String(50), nullable=False, index=True)  # vegan, vegetarian, eggetarian, non-vegetarian
    cost_inr = Column(Float, nullable=False)
    calories = Column(Float, nullable=False)
    protein = Column(Float, nullable=False)
    carbs = Column(Float, nullable=False)
    fat = Column(Float, nullable=False)
    prep_time = Column(Integer, nullable=False)
    
    # Serialized JSON text fields
    ingredients_json = Column(Text, nullable=False)
    ingredient_tokens_json = Column(Text, nullable=False)
    allergens_json = Column(Text, nullable=False, default="[]")
    instructions_json = Column(Text, nullable=False)
    image_url = Column(String(300), nullable=True)

    feedbacks = relationship("UserFeedback", back_populates="recipe", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "cuisine": self.cuisine,
            "meal_category": self.meal_category,
            "dietary_classification": self.dietary_classification,
            "cost_inr": self.cost_inr,
            "calories": self.calories,
            "protein": self.protein,
            "carbs": self.carbs,
            "fat": self.fat,
            "prep_time": self.prep_time,
            "ingredients": json.loads(self.ingredients_json) if self.ingredients_json else [],
            "ingredient_tokens": json.loads(self.ingredient_tokens_json) if self.ingredient_tokens_json else [],
            "allergens": json.loads(self.allergens_json) if self.allergens_json else [],
            "instructions": json.loads(self.instructions_json) if self.instructions_json else [],
            "image_url": self.image_url or ""
        }


class UserPreference(Base):
    __tablename__ = "user_preferences"

    user_id = Column(String(100), primary_key=True, index=True)
    age = Column(Integer, nullable=False)
    dietary_preference = Column(String(50), nullable=False)
    daily_budget_inr = Column(Float, nullable=False)
    daily_calorie_target = Column(Float, nullable=False)
    
    # Serialized JSON lists
    allergies_json = Column(Text, nullable=False, default="[]")
    available_ingredients_json = Column(Text, nullable=False, default="[]")
    preferred_cuisines_json = Column(Text, nullable=False, default="[]")
    meal_categories_json = Column(Text, nullable=False, default="[]")
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "age": self.age,
            "dietary_preference": self.dietary_preference,
            "allergies": json.loads(self.allergies_json) if self.allergies_json else [],
            "available_ingredients": json.loads(self.available_ingredients_json) if self.available_ingredients_json else [],
            "daily_budget_inr": self.daily_budget_inr,
            "daily_calorie_target": self.daily_calorie_target,
            "preferred_cuisines": json.loads(self.preferred_cuisines_json) if self.preferred_cuisines_json else [],
            "meal_categories": json.loads(self.meal_categories_json) if self.meal_categories_json else [],
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class UserFeedback(Base):
    __tablename__ = "user_feedbacks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100), nullable=False, index=True)
    recipe_id = Column(String(50), ForeignKey("recipes.id"), nullable=False, index=True)
    feedback_type = Column(String(20), nullable=False)  # 'like' or 'dislike'
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    recipe = relationship("Recipe", back_populates="feedbacks")

    __table_args__ = (
        Index("idx_user_recipe_feedback", "user_id", "recipe_id"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "recipe_id": self.recipe_id,
            "recipe_name": self.recipe.name if self.recipe else "",
            "cuisine": self.recipe.cuisine if self.recipe else "",
            "meal_category": self.recipe.meal_category if self.recipe else "",
            "feedback_type": self.feedback_type,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }


class MealPlanRecord(Base):
    __tablename__ = "meal_plan_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(100), nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    recipe_ids_json = Column(Text, nullable=False)
    total_calories = Column(Float, nullable=False)
    total_cost_inr = Column(Float, nullable=False)
    total_protein = Column(Float, nullable=False)
    total_carbs = Column(Float, nullable=False)
    total_fat = Column(Float, nullable=False)
    explanations_json = Column(Text, nullable=False, default="{}")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "recipe_ids": json.loads(self.recipe_ids_json) if self.recipe_ids_json else [],
            "total_calories": self.total_calories,
            "total_cost_inr": self.total_cost_inr,
            "total_protein": self.total_protein,
            "total_carbs": self.total_carbs,
            "total_fat": self.total_fat,
            "explanations": json.loads(self.explanations_json) if self.explanations_json else {}
        }
