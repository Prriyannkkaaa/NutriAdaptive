"""
Recipes API router.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.database import get_db
from backend.app.models import Recipe
from backend.app.schemas import RecipeSchema

router = APIRouter(prefix="/api/recipes", tags=["Recipes"])

@router.get("", response_model=List[RecipeSchema])
def list_recipes(
    category: Optional[str] = Query(None, description="Filter by meal category: breakfast, lunch, snacks, dinner"),
    cuisine: Optional[str] = Query(None, description="Filter by cuisine: North Indian, South Indian, Italian, etc."),
    diet: Optional[str] = Query(None, description="Filter by dietary classification: vegan, vegetarian, eggetarian, non-vegetarian"),
    max_cost: Optional[float] = Query(None, description="Maximum cost in INR"),
    max_cal: Optional[float] = Query(None, description="Maximum calories"),
    search: Optional[str] = Query(None, description="Search term in recipe name or ingredients"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Retrieve recipes from the 200-recipe catalog with optional multi-attribute filters."""
    query = db.query(Recipe)

    if category:
        query = query.filter(Recipe.meal_category == category.lower())
    if cuisine:
        query = query.filter(Recipe.cuisine.ilike(f"%{cuisine}%"))
    if diet:
        query = query.filter(Recipe.dietary_classification == diet.lower())
    if max_cost is not None:
        query = query.filter(Recipe.cost_inr <= max_cost)
    if max_cal is not None:
        query = query.filter(Recipe.calories <= max_cal)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                Recipe.name.ilike(search_pattern),
                Recipe.ingredients_json.ilike(search_pattern),
                Recipe.ingredient_tokens_json.ilike(search_pattern),
            )
        )

    recipes = query.offset(offset).limit(limit).all()
    return [RecipeSchema(**r.to_dict()) for r in recipes]

@router.get("/meta/cuisines")
def get_cuisines(db: Session = Depends(get_db)):
    """Retrieve unique cuisines available in the recipe dataset."""
    cuisines = [c[0] for c in db.query(Recipe.cuisine).distinct().all()]
    return {"cuisines": sorted(cuisines)}

@router.get("/meta/ingredients")
def get_common_ingredients(db: Session = Depends(get_db)):
    """Retrieve common searchable ingredient tags for the user input form."""
    recipes = db.query(Recipe).all()
    token_freq = {}
    for r in recipes:
        for t in r.to_dict().get("ingredient_tokens", []):
            token_freq[t] = token_freq.get(t, 0) + 1
    
    # Sort by frequency
    sorted_tokens = sorted(token_freq.keys(), key=lambda k: token_freq[k], reverse=True)
    return {"ingredients": sorted_tokens[:80]}

@router.get("/{recipe_id}", response_model=RecipeSchema)
def get_recipe(recipe_id: str, db: Session = Depends(get_db)):
    """Retrieve complete recipe details by ID."""
    rec = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail=f"Recipe '{recipe_id}' not found.")
    return RecipeSchema(**rec.to_dict())
