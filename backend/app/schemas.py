"""
Pydantic schemas for request validation and response models.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator

class RecipeSchema(BaseModel):
    id: str
    name: str
    cuisine: str
    meal_category: str
    dietary_classification: str
    cost_inr: float
    calories: float
    protein: float
    carbs: float
    fat: float
    prep_time: int
    ingredients: List[str]
    ingredient_tokens: List[str]
    allergens: List[str] = []
    instructions: List[str] = []
    image_url: Optional[str] = ""

    model_config = {"from_attributes": True}


class UserPreferenceInput(BaseModel):
    user_id: Optional[str] = Field(default="demo-user", description="Unique user or session identifier")
    age: int = Field(ge=1, le=120, description="Age of the user (1-120)")
    dietary_preference: str = Field(description="Dietary preference: vegetarian, vegan, eggetarian, or non-vegetarian")
    allergies: List[str] = Field(default_factory=list, description="Allergies to avoid: dairy, gluten, nuts, peanuts, eggs, soy, fish, shellfish, etc.")
    available_ingredients: List[str] = Field(default_factory=list, description="Ingredients currently available at home")
    daily_budget_inr: float = Field(gt=0, description="Target daily food budget in Indian Rupees")
    daily_calorie_target: float = Field(ge=600, le=6000, description="Target daily caloric intake (600 - 6000 kcal)")
    preferred_cuisines: List[str] = Field(default_factory=list, description="Preferred cuisines e.g. North Indian, South Indian, Italian, Chinese")
    meal_categories: List[str] = Field(default_factory=lambda: ["breakfast", "lunch", "dinner"], description="Meal slots to recommend")

    @field_validator("dietary_preference")
    @classmethod
    def validate_diet(cls, v: str) -> str:
        clean = v.strip().lower()
        valid = {"vegetarian", "vegan", "eggetarian", "non-vegetarian"}
        if clean not in valid:
            raise ValueError(f"Dietary preference must be one of {valid}")
        return clean

    @field_validator("meal_categories")
    @classmethod
    def validate_categories(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("At least one meal category must be selected.")
        valid = {"breakfast", "lunch", "snacks", "dinner"}
        cleaned = [c.strip().lower() for c in v if c.strip().lower() in valid]
        if not cleaned:
            raise ValueError(f"Valid meal categories include: {valid}")
        return cleaned


class UserPreferenceResponse(BaseModel):
    user_id: str
    age: int
    dietary_preference: str
    allergies: List[str]
    available_ingredients: List[str]
    daily_budget_inr: float
    daily_calorie_target: float
    preferred_cuisines: List[str]
    meal_categories: List[str]
    updated_at: Optional[str] = None


class RecommendationRequest(BaseModel):
    user_id: str = "demo-user"
    preferences: Optional[UserPreferenceInput] = None
    exclude_recipe_ids: List[str] = Field(default_factory=list, description="Recipe IDs to exclude from this run (for fresh regeneration)")


class MealExplanation(BaseModel):
    recipe_id: str
    recipe_name: str
    ingredient_match_pct: float
    matched_ingredients: List[str]
    cuisine_match: bool
    budget_fit: str
    calorie_fit: str
    feedback_influence: str
    total_score: float
    breakdown: Dict[str, float]


class MealPlanResponse(BaseModel):
    user_id: str
    meal_plan: List[RecipeSchema]
    meal_categories: List[str]
    total_calories: float
    total_cost_inr: float
    total_protein: float
    total_carbs: float
    total_fat: float
    calorie_target: float
    budget_target: float
    calorie_status: str
    budget_status: str
    explanations: Dict[str, MealExplanation]
    warnings: List[str] = []


class FeedbackInput(BaseModel):
    user_id: str
    recipe_id: str
    feedback_type: str

    @field_validator("feedback_type")
    @classmethod
    def validate_feedback(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean not in {"like", "dislike"}:
            raise ValueError("feedback_type must be either 'like' or 'dislike'")
        return clean


class FeedbackResponse(BaseModel):
    id: int
    user_id: str
    recipe_id: str
    recipe_name: str
    cuisine: str
    meal_category: str
    feedback_type: str
    timestamp: str


class FeedbackHistoryResponse(BaseModel):
    user_id: str
    total_likes: int
    total_dislikes: int
    history: List[FeedbackResponse]
    learned_affinity_summary: Dict[str, Any] = {}
