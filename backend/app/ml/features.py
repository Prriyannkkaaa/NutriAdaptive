"""
Feature representation and similarity computations using scikit-learn.
"""

from typing import List, Dict, Any, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class FeatureExtractor:
    """
    Extracts TF-IDF feature matrices from recipes and computes
    cosine similarities with user ingredients and liked/disliked profiles.
    """
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            lowercase=True,
            token_pattern=r"(?u)\b[\w-]+\b",
            stop_words="english"
        )
        self.is_fitted = False
        self.recipe_ids: List[str] = []
        self.recipe_feature_matrix = None

    def fit(self, recipes: List[Dict[str, Any]]):
        """Fit vectorizer on all recipes in dataset using ingredient tokens and cuisine."""
        self.recipe_ids = [r["id"] for r in recipes]
        corpus = []
        for r in recipes:
            tokens = r.get("ingredient_tokens", [])
            cuisine = r.get("cuisine", "")
            diet = r.get("dietary_classification", "")
            text = " ".join(tokens) + f" {cuisine} {diet}"
            corpus.append(text)

        self.recipe_feature_matrix = self.vectorizer.fit_transform(corpus)
        self.is_fitted = True

    def get_recipe_vector(self, recipe_index: int):
        if not self.is_fitted or self.recipe_feature_matrix is None:
            return None
        return self.recipe_feature_matrix[recipe_index]

    def compute_ingredient_similarity(
        self, available_ingredients: List[str], recipes: List[Dict[str, Any]]
    ) -> np.ndarray:
        """
        Compute similarity vector between available ingredients and all recipes.
        Combines TF-IDF cosine similarity and direct Jaccard token overlap.
        """
        if not available_ingredients or not self.is_fitted:
            return np.zeros(len(recipes), dtype=float)

        user_text = " ".join(available_ingredients)
        user_vec = self.vectorizer.transform([user_text])
        cos_sim = cosine_similarity(user_vec, self.recipe_feature_matrix)[0]

        # Also calculate direct token overlap ratio for high precision
        user_tokens_lower = {t.strip().lower() for t in available_ingredients if t.strip()}
        overlap_ratios = np.zeros(len(recipes), dtype=float)

        for i, r in enumerate(recipes):
            rec_tokens = set(r.get("ingredient_tokens", []))
            if rec_tokens:
                intersection = rec_tokens.intersection(user_tokens_lower)
                overlap_ratios[i] = len(intersection) / len(rec_tokens)

        # 60% TF-IDF cosine similarity + 40% token overlap
        combined = 0.6 * cos_sim + 0.4 * overlap_ratios
        return np.clip(combined, 0.0, 1.0)

    def compute_profile_similarity(
        self,
        liked_recipe_ids: List[str],
        disliked_recipe_ids: List[str],
        recipes: List[Dict[str, Any]]
    ) -> np.ndarray:
        """
        Rocchio-style feedback profile similarity.
        Computes affinity based on centroid of liked items minus centroid of disliked items.
        """
        if not self.is_fitted or (not liked_recipe_ids and not disliked_recipe_ids):
            return np.zeros(len(recipes), dtype=float)

        id_to_idx = {r_id: idx for idx, r_id in enumerate(self.recipe_ids)}
        
        liked_indices = [id_to_idx[rid] for rid in liked_recipe_ids if rid in id_to_idx]
        disliked_indices = [id_to_idx[rid] for rid in disliked_recipe_ids if rid in id_to_idx]

        liked_sim = np.zeros(len(recipes), dtype=float)
        disliked_sim = np.zeros(len(recipes), dtype=float)

        if liked_indices:
            liked_centroid = np.asarray(self.recipe_feature_matrix[liked_indices].mean(axis=0))
            liked_sim = cosine_similarity(liked_centroid, self.recipe_feature_matrix)[0]

        if disliked_indices:
            disliked_centroid = np.asarray(self.recipe_feature_matrix[disliked_indices].mean(axis=0))
            disliked_sim = cosine_similarity(disliked_centroid, self.recipe_feature_matrix)[0]

        # Rocchio combination: +0.6 * liked_similarity - 0.5 * disliked_similarity
        rocchio_scores = 0.6 * liked_sim - 0.5 * disliked_sim
        return rocchio_scores
