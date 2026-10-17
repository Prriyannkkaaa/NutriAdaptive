import type {
  Recipe,
  UserPreferences,
  MealPlanResponse,
  FeedbackHistoryResponse,
  MealPlanHistoryRecord,
} from '../types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<{ status: string; recipe_count: number; engine_fitted: boolean }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Backend health check failed');
  return res.json();
}

export async function fetchPreferences(userId: string = 'demo-user'): Promise<UserPreferences> {
  const res = await fetch(`${API_BASE}/preferences?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch user preferences');
  return res.json();
}

export async function savePreferences(preferences: UserPreferences): Promise<UserPreferences> {
  const res = await fetch(`${API_BASE}/preferences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail?.[0]?.msg || errorData.detail || 'Failed to save preferences');
  }
  return res.json();
}

export async function generateRecommendations(
  userId: string = 'demo-user',
  preferences?: UserPreferences,
  excludeRecipeIds: string[] = []
): Promise<MealPlanResponse> {
  const res = await fetch(`${API_BASE}/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      preferences: preferences || null,
      exclude_recipe_ids: excludeRecipeIds,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to generate recommendations');
  }
  return res.json();
}

export async function submitFeedback(
  userId: string,
  recipeId: string,
  feedbackType: 'like' | 'dislike'
): Promise<{ id: number; feedback_type: string }> {
  const res = await fetch(`${API_BASE}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      recipe_id: recipeId,
      feedback_type: feedbackType,
    }),
  });
  if (!res.ok) throw new Error('Failed to submit feedback');
  return res.json();
}

export async function fetchFeedbackHistory(userId: string = 'demo-user'): Promise<FeedbackHistoryResponse> {
  const res = await fetch(`${API_BASE}/feedback/history?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch feedback history');
  return res.json();
}

export async function resetFeedbackHistory(userId: string = 'demo-user'): Promise<void> {
  const res = await fetch(`${API_BASE}/feedback/reset?user_id=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to reset feedback history');
}

export async function fetchRecommendationHistory(
  userId: string = 'demo-user'
): Promise<{ user_id: string; total_records: number; history: MealPlanHistoryRecord[] }> {
  const res = await fetch(`${API_BASE}/recommendations/history?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error('Failed to fetch recommendation history');
  return res.json();
}

export async function fetchRecipes(params?: {
  category?: string;
  cuisine?: string;
  diet?: string;
  max_cost?: number;
  max_cal?: number;
  search?: string;
  limit?: number;
}): Promise<Recipe[]> {
  const query = new URLSearchParams();
  if (params?.category) query.append('category', params.category);
  if (params?.cuisine) query.append('cuisine', params.cuisine);
  if (params?.diet) query.append('diet', params.diet);
  if (params?.max_cost) query.append('max_cost', params.max_cost.toString());
  if (params?.max_cal) query.append('max_cal', params.max_cal.toString());
  if (params?.search) query.append('search', params.search);
  if (params?.limit) query.append('limit', params.limit.toString());

  const res = await fetch(`${API_BASE}/recipes?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch recipes');
  return res.json();
}

export async function fetchCommonIngredients(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/recipes/meta/ingredients`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.ingredients || [];
}
