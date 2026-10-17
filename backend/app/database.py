"""
Database configuration and SQLite session management using SQLAlchemy.
"""

from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Database path in backend directory
DB_PATH = Path(__file__).resolve().parent.parent / "meal_recommender.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency that yields a database session and safely closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
