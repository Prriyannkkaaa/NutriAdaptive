"""
FastAPI application entrypoint for the Personalized Meal Recommendation System.
"""

import sys
from pathlib import Path
from contextlib import asynccontextmanager

# Ensure root workspace is on python path
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.database import engine, Base, SessionLocal
from backend.app.data.seed import init_db, seed_recipes, seed_demo_profile
from backend.app.models import Recipe
from backend.app.ml.recommender import recommender_engine
from backend.app.routers import preferences, recommendations, recipes, feedback

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event to ensure database is created, seeded, and recommender engine fitted."""
    init_db()
    with SessionLocal() as session:
        seed_recipes(session)
        seed_demo_profile(session)
        # Preload recipes into recommender engine
        all_recipes = session.query(Recipe).all()
        recommender_engine.load_and_fit([r.to_dict() for r in all_recipes])
    yield

app = FastAPI(
    title="Personalized Meal Recommendation System with Feedback-Based Learning",
    description="End-to-end college-level Machine Learning recommendation system with adaptive feedback loops.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(preferences.router)
app.include_router(recommendations.router)
app.include_router(recipes.router)
app.include_router(feedback.router)

@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint validating backend status, database, and recommendation model."""
    with SessionLocal() as db:
        recipe_count = db.query(Recipe).count()
    return {
        "status": "healthy",
        "service": "Personalized Meal Recommendation System",
        "recipe_count": recipe_count,
        "engine_fitted": recommender_engine.feature_extractor.is_fitted
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
