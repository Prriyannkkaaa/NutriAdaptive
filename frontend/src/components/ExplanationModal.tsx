import React from 'react';
import type { Recipe, MealExplanation } from '../types';
import { X, Sparkles, Sliders, ThumbsUp } from 'lucide-react';

interface ExplanationModalProps {
  recipe: Recipe | null;
  explanation?: MealExplanation;
  onClose: () => void;
}

export const ExplanationModal: React.FC<ExplanationModalProps> = ({
  recipe,
  explanation,
  onClose,
}) => {
  if (!recipe || !explanation) return null;

  const breakdownItems = [
    { label: 'Ingredient Pantry Match', value: explanation.breakdown.ingredient, weight: '25%' },
    { label: 'Cuisine Preference Alignment', value: explanation.breakdown.cuisine, weight: '20%' },
    { label: 'Caloric Slot Proximity (Gaussian)', value: explanation.breakdown.calories, weight: '20%' },
    { label: 'Budget Suitability (INR)', value: explanation.breakdown.budget, weight: '15%' },
    { label: 'Feedback & Learned Affinity', value: explanation.breakdown.feedback, weight: '15%' },
    { label: 'Macro / Protein Density', value: explanation.breakdown.macro, weight: '5%' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-amber-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6 text-white flex items-start justify-between">
          <div className="space-y-1 pr-6">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-200">
              <Sparkles className="w-4 h-4 text-amber-300" />
              Machine Learning Transparency Engine
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">
              Why this meal was recommended:
            </h2>
            <p className="text-sm font-medium text-amber-100">{recipe.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Composite Score Card */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-amber-800">Overall Recommendation Score</div>
              <div className="text-xs text-amber-600">Calculated via multi-attribute utility function</div>
            </div>
            <div className="text-2xl font-black text-amber-900">
              {(explanation.total_score * 100).toFixed(1)} / 100
            </div>
          </div>

          {/* Key Factor Highlights */}
          <div className="space-y-3">
            {/* Ingredients */}
            <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-gray-800">
                <span>Ingredient Compatibility</span>
                <span className="text-amber-600 font-extrabold">{explanation.ingredient_match_pct}% match</span>
              </div>
              {explanation.matched_ingredients.length > 0 ? (
                <div className="text-xs text-gray-600">
                  Matches your pantry: <b>{explanation.matched_ingredients.join(', ')}</b>
                </div>
              ) : (
                <div className="text-xs text-gray-400 italic">No direct overlap with pantry staples</div>
              )}
            </div>

            {/* Cuisine Match */}
            <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-gray-800">Cuisine Alignment ({recipe.cuisine})</span>
                <p className="text-gray-500 text-[11px]">Matches user preferred cuisines</p>
              </div>
              {explanation.cuisine_match ? (
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                  Matched
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-gray-200 text-gray-700">Exploratory</span>
              )}
            </div>

            {/* Budget & Calorie */}
            <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 space-y-1 text-xs">
              <div className="font-bold text-gray-800">Budget & Calorie Fit</div>
              <div className="text-gray-600">• Budget: {explanation.budget_fit}</div>
              <div className="text-gray-600">• Calories: {explanation.calorie_fit}</div>
            </div>

            {/* Feedback Influence */}
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <ThumbsUp className="w-3.5 h-3.5 text-amber-600" />
                Adaptive Feedback Influence
              </div>
              <p className="text-amber-800 font-medium">{explanation.feedback_influence}</p>
            </div>
          </div>

          {/* Detailed Weight Breakdown Bars */}
          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-gray-500" />
              Algorithmic Component Scores
            </h4>
            <div className="space-y-2">
              {breakdownItems.map((item, idx) => {
                const pct = Math.min(100, Math.max(0, Math.round(item.value * 100)));
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-medium text-gray-700">
                      <span>{item.label} <span className="text-gray-400">({item.weight})</span></span>
                      <span className="font-bold">{(item.value * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-gray-900 text-white font-semibold text-xs hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
