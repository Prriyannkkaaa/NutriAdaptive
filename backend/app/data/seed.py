"""
Database seeder to populate recipes and initial sample data in SQLite.
"""

import json
import sys
from pathlib import Path

# Ensure root workspace directory is in python path
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))

from sqlalchemy.orm import Session
from backend.app.database import engine, Base, SessionLocal
from backend.app.models import Recipe, UserPreference


def init_db():
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)

def seed_recipes(db: Session) -> int:
    """Load recipes from recipes.json into database if not already loaded."""
    json_path = Path(__file__).resolve().parent / "recipes.json"
    if not json_path.exists():
        raise FileNotFoundError(f"Recipes file not found at {json_path}")

    with open(json_path, "r", encoding="utf-8") as f:
        recipes_data = json.load(f)

    existing_count = db.query(Recipe).count()
    if existing_count >= len(recipes_data):
        print(f"Database already contains {existing_count} recipes. Skipping duplicate seed.")
        return existing_count

    inserted = 0
    for r in recipes_data:
        existing = db.query(Recipe).filter(Recipe.id == r["id"]).first()
        if not existing:
            recipe_obj = Recipe(
                id=r["id"],
                name=r["name"],
                cuisine=r["cuisine"],
                meal_category=r["meal_category"],
                dietary_classification=r["dietary_classification"],
                cost_inr=r["cost_inr"],
                calories=r["calories"],
                protein=r["protein"],
                carbs=r["carbs"],
                fat=r["fat"],
                prep_time=r["prep_time"],
                ingredients_json=json.dumps(r.get("ingredients", [])),
                ingredient_tokens_json=json.dumps(r.get("ingredient_tokens", [])),
                allergens_json=json.dumps(r.get("allergens", [])),
                instructions_json=json.dumps(r.get("instructions", [])),
                image_url=r.get("image_url", "")
            )
            db.add(recipe_obj)
            inserted += 1

    db.commit()
    print(f"Successfully seeded {inserted} recipes into SQLite database.")
    return db.query(Recipe).count()

def seed_demo_profile(db: Session):
    """Seed a default demo user preference if none exists."""
    demo_user = db.query(UserPreference).filter(UserPreference.user_id == "demo-user").first()
    if not demo_user:
        pref = UserPreference(
            user_id="demo-user",
            age=24,
            dietary_preference="vegetarian",
            daily_budget_inr=200.0,
            daily_calorie_target=1800.0,
            allergies_json=json.dumps([]),
            available_ingredients_json=json.dumps(["paneer", "rice", "tomato", "onion", "wheat flour", "ghee"]),
            preferred_cuisines_json=json.dumps(["North Indian", "South Indian", "Italian"]),
            meal_categories_json=json.dumps(["breakfast", "lunch", "dinner"])
        )
        db.add(pref)
        db.commit()
        print("Initialized default demo-user preferences.")

if __name__ == "__main__":
    init_db()
    with SessionLocal() as session:
        seed_recipes(session)
        seed_demo_profile(session)
