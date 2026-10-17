import React, { useState } from 'react';
import type { Recipe, MealPlanResponse, MealExplanation } from '../types';
import { MealCard } from './MealCard';
import { NutritionBudgetSummary } from './NutritionBudgetSummary';
import { RecipeModal } from './RecipeModal';
import { ExplanationModal } from './ExplanationModal';
import {
  RotateCcw,
  Sparkles,
  AlertCircle,
  UtensilsCrossed,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

interface DashboardViewProps {
  plan: MealPlanResponse | null;
  loading: boolean;
  onRegenerate: () => Promise<void>;
  onLikeMeal: (recipeId: string) => Promise<void>;
  onDislikeMeal: (recipeId: string) => Promise<void>;
  userFeedbackMap: Record<string, 'like' | 'dislike'>;
  onGoToPreferences: () => void;
  lastFeedbackNotice?: string | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  plan,
  loading,
  onRegenerate,
  onLikeMeal,
  onDislikeMeal,
  userFeedbackMap,
  onGoToPreferences,
  lastFeedbackNotice,
}) => {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [explanationModal, setExplanationModal] = useState<{
    recipe: Recipe | null;
    explanation?: MealExplanation;
  }>({ recipe: null });

  if (loading && !plan) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-12 h-12 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <h3 className="text-xl font-bold text-gray-800">Generating Your Personalized Meal Plan...</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Filtering hard constraints, calculating cosine ingredient similarities, and applying learned feedback weights.
        </p>
      </div>
    );
  }

  if (!plan || plan.meal_plan.length === 0) {
    return (
      <div className="py-16 text-center max-w-lg mx-auto bg-white p-10 rounded-3xl border border-amber-100 shadow-sm space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">No Eligible Meal Plan Found</h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          The dataset could not find recipes satisfying all strict dietary constraints, allergies, and calorie limits.
          Try relaxing allergy filters or broadening your preferred cuisines.
        </p>
        <button
          onClick={onGoToPreferences}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-colors cursor-pointer"
        >
          <Sliders className="w-4 h-4" />
          Adjust Preferences
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      {/* Top Banner with Regenerate Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-amber-100 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Active Personalized Plan ({plan.meal_plan.length} Meals)
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Today's Recommended Meal Schedule
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Rate any meal with Like or Dislike to train the engine, then hit <b>Regenerate</b> to observe adaptive ranking shifts!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRegenerate}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm shadow-md shadow-orange-500/25 hover:from-amber-600 hover:to-orange-600 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Re-scoring...' : 'Regenerate Meal Plan'}
          </button>
        </div>
      </div>

      {/* Dynamic Feedback Notification Banner */}
      {lastFeedbackNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{lastFeedbackNotice}</span>
          </div>
          <span className="text-emerald-700 font-bold hidden sm:inline">
            Click 'Regenerate Meal Plan' to apply weights
          </span>
        </div>
      )}

      {/* Warnings & Constraints Notices */}
      {plan.warnings && plan.warnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Notice from Recommender Engine:
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-amber-800">
            {plan.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Meal Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-600" />
            Daily Meal Schedule
          </h2>
          <span className="text-xs text-gray-500">
            Target: ₹{plan.budget_target} / {plan.calorie_target} kcal
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plan.meal_plan.map((meal) => (
            <MealCard
              key={meal.id}
              recipe={meal}
              explanation={plan.explanations[meal.id]}
              feedback={userFeedbackMap[meal.id] || null}
              onLike={onLikeMeal}
              onDislike={onDislikeMeal}
              onOpenExplanation={(r, exp) => setExplanationModal({ recipe: r, explanation: exp })}
              onOpenRecipe={(r) => setSelectedRecipe(r)}
            />
          ))}
        </div>
      </div>

      {/* Nutrition & Budget Summary Visualization */}
      <NutritionBudgetSummary plan={plan} />

      {/* Modals */}
      <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
      <ExplanationModal
        recipe={explanationModal.recipe}
        explanation={explanationModal.explanation}
        onClose={() => setExplanationModal({ recipe: null })}
      />
    </div>
  );
};
