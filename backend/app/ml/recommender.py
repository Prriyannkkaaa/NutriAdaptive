"""
Machine Learning Content-Based Recommendation Engine with Feedback Adaptation.
Implements multi-attribute utility theory, constraint satisfaction, and Rocchio feedback learning.
"""

from typing import List, Dict, Any, Optional, Set, Tuple
import math
import numpy as np
from sqlalchemy.orm import Session
from backend.app.models import Recipe, UserFeedback, UserPreference
from backend.app.ml.features import FeatureExtractor

# Standard meal slot calorie & budget distribution weights
SLOT_DISTRIBUTIONS = {
    "breakfast": {"cal_share": 0.25, "cost_share": 0.20},
    "lunch": {"cal_share": 0.40, "cost_share": 0.40},
    "snacks": {"cal_share": 0.10, "cost_share": 0.15},
    "dinner": {"cal_share": 0.25, "cost_share": 0.25},
}

class MealRecommender:
    def __init__(self, feature_extractor: Optional[FeatureExtractor] = None):
        self.feature_extractor = feature_extractor or FeatureExtractor()
        self.cached_recipes: List[Dict[str, Any]] = []

    def load_and_fit(self, recipes: List[Dict[str, Any]]):
        """Cache recipes and fit TF-IDF vectorizer."""
        self.cached_recipes = recipes
        self.feature_extractor.fit(recipes)

    def filter_hard_constraints(
        self,
        recipes: List[Dict[str, Any]],
        dietary_preference: str,
        allergies: List[str],
        meal_category: str,
        exclude_recipe_ids: Optional[Set[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Stage A: Strict constraint filter.
        Filters by:
        1. Meal Category (breakfast, lunch, snacks, dinner)
        2. Dietary restrictions (vegan -> vegan; vegetarian -> vegan/veg; eggetarian -> vegan/veg/egg; non-veg -> all)
        3. Allergies (dairy, gluten, nuts, peanuts, eggs, soy, fish, shellfish, mustard, sesame)
        4. Excluded recipe IDs (for regeneration or avoidance)
        """
        exclude_set = exclude_recipe_ids or set()
        user_allergies_lower = {a.strip().lower() for a in allergies if a.strip()}
        diet_lower = dietary_preference.strip().lower()

        eligible = []
        for r in recipes:
            if r["id"] in exclude_set:
                continue

            # Check meal category
            if r["meal_category"].lower() != meal_category.lower():
                continue

            # Check dietary preference
            rec_diet = r["dietary_classification"].lower()
            if diet_lower == "vegan" and rec_diet != "vegan":
                continue
            if diet_lower == "vegetarian" and rec_diet not in {"vegan", "vegetarian"}:
                continue
            if diet_lower == "eggetarian" and rec_diet not in {"vegan", "vegetarian", "eggetarian"}:
                continue

            # Check allergies against declared allergens and ingredient tokens
            rec_allergens = {a.lower() for a in r.get("allergens", [])}
            rec_tokens = {t.lower() for t in r.get("ingredient_tokens", [])}
            
            # Common token allergen aliases
            allergen_token_aliases = {
                "dairy": {"milk", "paneer", "butter", "ghee", "cheese", "curd", "cream", "yogurt"},
                "gluten": {"wheat", "maida", "sooji", "semolina", "pasta", "bread", "noodles", "paratha", "roti", "flour"},
                "peanuts": {"peanuts", "peanut"},
                "nuts": {"cashews", "almonds", "walnuts", "nuts"},
                "eggs": {"eggs", "egg"},
                "soy": {"tofu", "soya", "soy"},
                "fish": {"fish", "salmon", "rohu"},
                "shellfish": {"prawns", "shrimp", "calamari", "squid"},
                "mustard": {"mustard"},
                "sesame": {"sesame"}
            }

            has_allergen = False
            for allergy in user_allergies_lower:
                if allergy in rec_allergens:
                    has_allergen = True
                    break
                # Check aliases in ingredient tokens
                aliases = allergen_token_aliases.get(allergy, {allergy})
                if aliases.intersection(rec_tokens):
                    has_allergen = True
                    break

            if has_allergen:
                continue

            eligible.append(r)

        return eligible

    def get_learned_user_profile(self, user_id: str, db: Session) -> Dict[str, Any]:
        """
        Retrieve user's historical feedback from SQLite and build dynamic profile:
        - Liked recipe IDs and Disliked recipe IDs
        - Cuisine affinity scores
        - Ingredient token affinity scores
        """
        feedbacks = db.query(UserFeedback).filter(UserFeedback.user_id == user_id).all()
        liked_ids = [f.recipe_id for f in feedbacks if f.feedback_type == "like"]
        disliked_ids = [f.recipe_id for f in feedbacks if f.feedback_type == "dislike"]

        # Build recipe lookup
        recipe_dict = {r["id"]: r for r in self.cached_recipes}
        cuisine_affinity: Dict[str, float] = {}
        ingredient_affinity: Dict[str, float] = {}

        for f in feedbacks:
            r = recipe_dict.get(f.recipe_id)
            if not r:
                continue
            delta = 0.4 if f.feedback_type == "like" else -0.5
            cui = r.get("cuisine", "")
            if cui:
                cuisine_affinity[cui] = cuisine_affinity.get(cui, 0.0) + delta

            ing_delta = 0.15 if f.feedback_type == "like" else -0.25
            for token in r.get("ingredient_tokens", []):
                ingredient_affinity[token] = ingredient_affinity.get(token, 0.0) + ing_delta

        return {
            "liked_ids": liked_ids,
            "disliked_ids": disliked_ids,
            "cuisine_affinity": cuisine_affinity,
            "ingredient_affinity": ingredient_affinity,
            "total_feedback_count": len(feedbacks)
        }

    def score_recipes(
        self,
        candidate_recipes: List[Dict[str, Any]],
        all_recipes: List[Dict[str, Any]],
        preferences: Dict[str, Any],
        meal_category: str,
        target_calories_slot: float,
        target_budget_slot: float,
        learned_profile: Dict[str, Any],
        weights: Optional[Dict[str, float]] = None
    ) -> List[Tuple[Dict[str, Any], float, Dict[str, Any]]]:
        """
        Stages B & C: Calculate multi-attribute feature scores, normalize, and combine.
        Features scored:
        1. Ingredient compatibility (TF-IDF + Token overlap)
        2. Cuisine preference + learned cuisine affinity
        3. Caloric target suitability (Gaussian proximity)
        4. Budget suitability (Asymmetric penalty)
        5. Nutritional balance (Protein density)
        6. Feedback-based learning influence (Liked items similarity - Disliked items penalty)
        """
        if not candidate_recipes:
            return []

        w = weights or {
            "ing": 0.25,
            "cui": 0.20,
            "cal": 0.20,
            "bud": 0.15,
            "macro": 0.05,
            "fb": 0.15
        }

        avail_ing = preferences.get("available_ingredients", [])
        pref_cuisines = {c.strip().lower() for c in preferences.get("preferred_cuisines", [])}

        # Vectorized ingredient similarity for all candidates
        ing_sim_all = self.feature_extractor.compute_ingredient_similarity(avail_ing, self.cached_recipes)
        id_to_all_idx = {r["id"]: idx for idx, r in enumerate(self.cached_recipes)}

        # Feedback profile content similarity
        fb_profile_sim = self.feature_extractor.compute_profile_similarity(
            learned_profile["liked_ids"],
            learned_profile["disliked_ids"],
            self.cached_recipes
        )

        disliked_set = set(learned_profile.get("disliked_ids", []))
        liked_set = set(learned_profile.get("liked_ids", []))
        cuisine_aff = learned_profile.get("cuisine_affinity", {})
        ing_aff = learned_profile.get("ingredient_affinity", {})

        scored_list = []
        for r in candidate_recipes:
            all_idx = id_to_all_idx.get(r["id"], 0)

            # 1. Ingredient Score (0.0 to 1.0)
            score_ing = float(ing_sim_all[all_idx])

            # 2. Cuisine Score
            cui = r.get("cuisine", "")
            base_cui = 1.0 if cui.strip().lower() in pref_cuisines else 0.35
            learned_cui_boost = cuisine_aff.get(cui, 0.0)
            score_cui = max(0.0, min(1.0, base_cui + (learned_cui_boost * 0.3)))

            # 3. Calorie Proximity (Gaussian Bell Curve)
            cal = r["calories"]
            sigma_cal = max(50.0, target_calories_slot * 0.30)
            score_cal = math.exp(-((cal - target_calories_slot) ** 2) / (2 * (sigma_cal ** 2)))

            # 4. Budget Suitability
            cost = r["cost_inr"]
            if cost <= target_budget_slot:
                # Modest penalty if it's excessively cheap, otherwise near 1.0
                diff = target_budget_slot - cost
                score_bud = max(0.6, 1.0 - (0.3 * (diff / target_budget_slot)))
            else:
                over = cost - target_budget_slot
                score_bud = max(0.0, 1.0 - (over / (target_budget_slot * 1.5)))

            # 5. Macro (Protein Density)
            p_ratio = r["protein"] / max(1.0, (cal / 30.0))
            score_macro = min(1.0, p_ratio)

            # 6. Feedback Influence
            # Direct recipe penalty/boost
            direct_fb = 0.0
            if r["id"] in disliked_set:
                direct_fb = -2.5  # Severe penalty so disliked recipe is suppressed
            elif r["id"] in liked_set:
                direct_fb = 0.4

            # Feature-level learned ingredient affinity
            token_aff_sum = sum(ing_aff.get(t, 0.0) for t in r.get("ingredient_tokens", []))
            token_aff_score = max(-0.5, min(0.5, token_aff_sum * 0.2))

            # Content similarity from Rocchio centroid
            content_fb_score = float(fb_profile_sim[all_idx]) if fb_profile_sim is not None else 0.0

            total_fb_effect = direct_fb + token_aff_score + content_fb_score
            score_fb = max(0.0, min(1.0, 0.5 + (total_fb_effect * 0.5)))
            if r["id"] in disliked_set:
                score_fb = 0.001  # Disliked gets near-zero feedback score

            # Weighted sum
            composite_score = (
                w["ing"] * score_ing +
                w["cui"] * score_cui +
                w["cal"] * score_cal +
                w["bud"] * score_bud +
                w["macro"] * score_macro +
                w["fb"] * score_fb
            )

            # If heavily disliked, apply overall multiplier suppression
            if r["id"] in disliked_set:
                composite_score *= 0.10

            details = {
                "score_ing": round(score_ing, 3),
                "score_cui": round(score_cui, 3),
                "score_cal": round(score_cal, 3),
                "score_bud": round(score_bud, 3),
                "score_macro": round(score_macro, 3),
                "score_fb": round(score_fb, 3),
                "composite_score": round(composite_score, 4),
                "target_cal": target_calories_slot,
                "target_budget": target_budget_slot,
                "fb_effect": round(total_fb_effect, 3)
            }

            scored_list.append((r, composite_score, details))

        # Sort descending by composite score
        scored_list.sort(key=lambda x: x[1], reverse=True)
        return scored_list

    def generate_meal_plan(
        self,
        preferences: Dict[str, Any],
        db: Session,
        user_id: str = "demo-user",
        exclude_recipe_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Stage D, E, F: Assemble daily meal plan satisfying constraints, optimizing
        variety, preventing duplicate recommendations, and compiling transparent explanations.
        """
        categories = preferences.get("meal_categories", ["breakfast", "lunch", "dinner"])
        if not categories:
            categories = ["breakfast", "lunch", "dinner"]

        total_cal_target = float(preferences.get("daily_calorie_target", 2000.0))
        total_budget_target = float(preferences.get("daily_budget_inr", 300.0))
        diet_pref = preferences.get("dietary_preference", "vegetarian")
        allergies = preferences.get("allergies", [])
        available_ing = preferences.get("available_ingredients", [])

        # Normalize slot shares for the selected categories
        raw_shares = {c: SLOT_DISTRIBUTIONS.get(c, {"cal_share": 0.25, "cost_share": 0.25}) for c in categories}
        sum_cal_shares = sum(s["cal_share"] for s in raw_shares.values()) or 1.0
        sum_cost_shares = sum(s["cost_share"] for s in raw_shares.values()) or 1.0

        slot_targets = {}
        for c in categories:
            slot_targets[c] = {
                "cal": total_cal_target * (raw_shares[c]["cal_share"] / sum_cal_shares),
                "cost": total_budget_target * (raw_shares[c]["cost_share"] / sum_cost_shares)
            }

        # Retrieve user's feedback profile from DB
        learned_profile = self.get_learned_user_profile(user_id, db)

        selected_plan: List[Dict[str, Any]] = []
        explanations: Dict[str, Any] = {}
        warnings: List[str] = []

        chosen_recipe_ids: Set[str] = set(exclude_recipe_ids or [])
        used_tokens: Set[str] = set()

        avail_tokens_set = {t.strip().lower() for t in available_ing if t.strip()}

        for cat in categories:
            targets = slot_targets[cat]
            eligible = self.filter_hard_constraints(
                recipes=self.cached_recipes,
                dietary_preference=diet_pref,
                allergies=allergies,
                meal_category=cat,
                exclude_recipe_ids=chosen_recipe_ids
            )

            if not eligible:
                # If exclusions were too strict, try without temporary regeneration exclusions
                if chosen_recipe_ids:
                    eligible = self.filter_hard_constraints(
                        recipes=self.cached_recipes,
                        dietary_preference=diet_pref,
                        allergies=allergies,
                        meal_category=cat,
                        exclude_recipe_ids=None
                    )
                
                if not eligible:
                    warnings.append(
                        f"No {diet_pref} recipes found for '{cat}' respecting allergies {allergies}. Consider relaxing dietary constraints."
                    )
                    continue

            scored = self.score_recipes(
                candidate_recipes=eligible,
                all_recipes=self.cached_recipes,
                preferences=preferences,
                meal_category=cat,
                target_calories_slot=targets["cal"],
                target_budget_slot=targets["cost"],
                learned_profile=learned_profile
            )

            if not scored:
                continue

            # Diversity selection: penalize candidate if heavily sharing tokens with meals already chosen today
            best_pick = None
            best_adj_score = -999.0
            best_details = None

            for r, raw_score, details in scored[:5]:  # inspect top 5 candidates
                rec_tokens = set(r.get("ingredient_tokens", []))
                overlap_with_today = len(rec_tokens.intersection(used_tokens))
                diversity_penalty = overlap_with_today * 0.05
                adjusted_score = raw_score - diversity_penalty

                if adjusted_score > best_adj_score:
                    best_adj_score = adjusted_score
                    best_pick = r
                    best_details = details

            if not best_pick:
                best_pick, _, best_details = scored[0]

            chosen_recipe_ids.add(best_pick["id"])
            used_tokens.update(best_pick.get("ingredient_tokens", []))
            selected_plan.append(best_pick)

            # Build human-readable explanation
            matched_ing = [t for t in best_pick.get("ingredient_tokens", []) if t in avail_tokens_set]
            match_pct = (len(matched_ing) / max(1, len(best_pick.get("ingredient_tokens", [])))) * 100.0

            # Cuisine match description
            pref_cuisines = {c.strip().lower() for c in preferences.get("preferred_cuisines", [])}
            is_cui_match = best_pick.get("cuisine", "").strip().lower() in pref_cuisines

            # Feedback influence description
            fb_desc = "Neutral prior"
            if best_pick["id"] in learned_profile.get("liked_ids", []):
                fb_desc = "Explicitly Liked: Heavily prioritized from past positive feedback."
            elif best_pick.get("cuisine") in learned_profile.get("cuisine_affinity", {}):
                c_score = learned_profile["cuisine_affinity"][best_pick["cuisine"]]
                if c_score > 0:
                    fb_desc = f"Learned Preference: Boosted based on past likes for {best_pick['cuisine']} meals."
                elif c_score < 0:
                    fb_desc = f"Adjusted: Cuisine {best_pick['cuisine']} received negative ratings previously."
            elif len(matched_ing) > 0:
                fb_desc = f"High ingredient overlap with your kitchen pantry ({', '.join(matched_ing[:3])})."

            cal_diff = round(best_pick["calories"] - targets["cal"])
            cal_desc = f"{best_pick['calories']} kcal (within {abs(cal_diff)} kcal of {round(targets['cal'])} kcal slot target)"
            
            bud_diff = round(targets["cost"] - best_pick["cost_inr"])
            if bud_diff >= 0:
                bud_desc = f"₹{best_pick['cost_inr']} (₹{bud_diff} within ₹{round(targets['cost'])} slot allocation)"
            else:
                bud_desc = f"₹{best_pick['cost_inr']} (₹{abs(bud_diff)} above ₹{round(targets['cost'])} slot target)"

            explanations[best_pick["id"]] = {
                "recipe_id": best_pick["id"],
                "recipe_name": best_pick["name"],
                "ingredient_match_pct": round(match_pct, 1),
                "matched_ingredients": matched_ing,
                "cuisine_match": is_cui_match,
                "budget_fit": bud_desc,
                "calorie_fit": cal_desc,
                "feedback_influence": fb_desc,
                "total_score": round(best_details["composite_score"], 3),
                "breakdown": {
                    "ingredient": best_details["score_ing"],
                    "cuisine": best_details["score_cui"],
                    "calories": best_details["score_cal"],
                    "budget": best_details["score_bud"],
                    "macro": best_details["score_macro"],
                    "feedback": best_details["score_fb"]
                }
            }

        # Calculate totals
        tot_cal = sum(r["calories"] for r in selected_plan)
        tot_cost = sum(r["cost_inr"] for r in selected_plan)
        tot_p = sum(r["protein"] for r in selected_plan)
        tot_c = sum(r["carbs"] for r in selected_plan)
        tot_f = sum(r["fat"] for r in selected_plan)

        cal_status = "on_target"
        if tot_cal < total_cal_target * 0.85:
            cal_status = "below_target"
            warnings.append(f"Total plan calories ({round(tot_cal)} kcal) are below target ({round(total_cal_target)} kcal).")
        elif tot_cal > total_cal_target * 1.15:
            cal_status = "above_target"
            warnings.append(f"Total plan calories ({round(tot_cal)} kcal) exceed target ({round(total_cal_target)} kcal).")

        budget_status = "within_budget" if tot_cost <= total_budget_target else "exceeded_budget"
        if budget_status == "exceeded_budget":
            warnings.append(f"Total estimated cost (₹{round(tot_cost)}) exceeds daily budget target (₹{round(total_budget_target)}).")

        return {
            "user_id": user_id,
            "meal_plan": selected_plan,
            "meal_categories": [r["meal_category"] for r in selected_plan],
            "total_calories": round(tot_cal, 1),
            "total_cost_inr": round(tot_cost, 1),
            "total_protein": round(tot_p, 1),
            "total_carbs": round(tot_c, 1),
            "total_fat": round(tot_f, 1),
            "calorie_target": total_cal_target,
            "budget_target": total_budget_target,
            "calorie_status": cal_status,
            "budget_status": budget_status,
            "explanations": explanations,
            "warnings": warnings
        }

# Global singleton recommender instance
recommender_engine = MealRecommender()
