import React from 'react';
import type { Recipe } from '../types';
import { X, Clock, Flame, IndianRupee, ShieldAlert } from 'lucide-react';

interface RecipeModalProps {
  recipe: Recipe | null;
  onClose: () => void;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, onClose }) => {
  if (!recipe) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-amber-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-6 text-white flex items-start justify-between">
          <div className="space-y-1 pr-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-white/20">
                {recipe.meal_category}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 capitalize">
                {recipe.dietary_classification}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20">
                {recipe.cuisine}
              </span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">{recipe.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-orange-50 border border-orange-100">
              <div className="flex items-center justify-center gap-1 text-xs text-orange-600 font-semibold mb-0.5">
                <Flame className="w-3.5 h-3.5" />
                Calories
              </div>
              <div className="text-base font-extrabold text-gray-900">{recipe.calories} kcal</div>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
              <div className="flex items-center justify-center gap-1 text-xs text-emerald-600 font-semibold mb-0.5">
                <IndianRupee className="w-3.5 h-3.5" />
                Cost
              </div>
              <div className="text-base font-extrabold text-emerald-700">₹{recipe.cost_inr}</div>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100">
              <div className="flex items-center justify-center gap-1 text-xs text-blue-600 font-semibold mb-0.5">
                <Clock className="w-3.5 h-3.5" />
                Prep Time
              </div>
              <div className="text-base font-extrabold text-gray-900">{recipe.prep_time} mins</div>
            </div>

            <div className="p-3 rounded-2xl bg-purple-50 border border-purple-100">
              <div className="text-xs text-purple-600 font-semibold mb-0.5">Protein</div>
              <div className="text-base font-extrabold text-purple-900">{recipe.protein}g</div>
            </div>
          </div>

          {/* Allergens Notification */}
          {recipe.allergens && recipe.allergens.length > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <b>Contains allergens:</b> {recipe.allergens.join(', ')}
              </span>
            </div>
          )}

          {/* Ingredients list */}
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Ingredients & Portions</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>{ing}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Step-by-Step Instructions */}
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-2">Preparation Instructions</h3>
            <ol className="space-y-3">
              {recipe.instructions.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
