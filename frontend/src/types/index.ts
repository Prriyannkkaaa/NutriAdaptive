export interface Recipe {
  id: string;
  name: string;
  cuisine: string;
  meal_category: 'breakfast' | 'lunch' | 'snacks' | 'dinner';
  dietary_classification: 'vegan' | 'vegetarian' | 'eggetarian' | 'non-vegetarian';
  cost_inr: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prep_time: number;
  ingredients: string[];
  ingredient_tokens: string[];
  allergens: string[];
  instructions: string[];
  image_url?: string;
}

export interface UserPreferences {
  user_id: string;
  age: number;
  dietary_preference: string;
  allergies: string[];
  available_ingredients: string[];
  daily_budget_inr: number;
  daily_calorie_target: number;
  preferred_cuisines: string[];
  meal_categories: string[];
  updated_at?: string;
}

export interface MealExplanation {
  recipe_id: string;
  recipe_name: string;
  ingredient_match_pct: number;
  matched_ingredients: string[];
  cuisine_match: boolean;
  budget_fit: string;
  calorie_fit: string;
  feedback_influence: string;
  total_score: number;
  breakdown: {
    ingredient: number;
    cuisine: number;
    calories: number;
    budget: number;
    macro: number;
    feedback: number;
  };
}

export interface MealPlanResponse {
  user_id: string;
  meal_plan: Recipe[];
  meal_categories: string[];
  total_calories: number;
  total_cost_inr: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  calorie_target: number;
  budget_target: number;
  calorie_status: 'on_target' | 'below_target' | 'above_target';
  budget_status: 'within_budget' | 'exceeded_budget';
  explanations: Record<string, MealExplanation>;
  warnings: string[];
}

export interface FeedbackRecord {
  id: number;
  user_id: string;
  recipe_id: string;
  recipe_name: string;
  cuisine: string;
  meal_category: string;
  feedback_type: 'like' | 'dislike';
  timestamp: string;
}

export interface FeedbackHistoryResponse {
  user_id: string;
  total_likes: number;
  total_dislikes: number;
  history: FeedbackRecord[];
  learned_affinity_summary: {
    cuisine_affinity?: Record<string, number>;
    top_liked_ingredients?: string[];
    top_disliked_ingredients?: string[];
  };
}

export interface MealPlanHistoryRecord {
  id: number;
  user_id: string;
  created_at: string;
  recipe_ids: string[];
  meals: Recipe[];
  total_calories: number;
  total_cost_inr: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  explanations: Record<string, MealExplanation>;
}
