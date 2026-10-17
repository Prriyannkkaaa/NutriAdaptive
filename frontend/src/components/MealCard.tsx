import React from 'react';
import type { Recipe, MealExplanation } from '../types';
import {
  ThumbsUp,
  ThumbsDown,
  Clock,
  Flame,
  IndianRupee,
  HelpCircle,
  Eye,
} from 'lucide-react';

interface MealCardProps {
  recipe: Recipe;
  explanation?: MealExplanation;
  feedback?: 'like' | 'dislike' | null;
  onLike: (recipeId: string) => void;
  onDislike: (recipeId: string) => void;
  onOpenExplanation: (recipe: Recipe, explanation?: MealExplanation) => void;
  onOpenRecipe: (recipe: Recipe) => void;
}

export const MealCard: React.FC<MealCardProps> = ({
  recipe,
  explanation,
  feedback,
  onLike,
  onDislike,
  onOpenExplanation,
  onOpenRecipe,
}) => {
  const getDietaryBadge = (diet: string) => {
    switch (diet) {
      case 'vegan':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'vegetarian':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'eggetarian':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  const getSlotBadge = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'breakfast':
        return 'bg-amber-500 text-white';
      case 'lunch':
        return 'bg-orange-500 text-white';
      case 'snacks':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-purple-600 text-white';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-amber-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
      {/* Top Banner */}
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span
            className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md tracking-wider shadow-2xs ${getSlotBadge(
              recipe.meal_category
            )}`}
          >
            {recipe.meal_category}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border capitalize ${getDietaryBadge(
                recipe.dietary_classification
              )}`}
            >
              {recipe.dietary_classification}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
              {recipe.cuisine}
            </span>
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 group-hover:text-amber-700 transition-colors line-clamp-1">
          {recipe.name}
        </h3>

        {/* Nutritional & Cost Highlights */}
        <div className="grid grid-cols-3 gap-2 mt-3 p-2.5 rounded-xl bg-amber-50/50 border border-amber-100/60 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-gray-500">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              Calories
            </div>
            <div className="text-sm font-extrabold text-gray-900">{Math.round(recipe.calories)} kcal</div>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-gray-500">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
              Est. Cost
            </div>
            <div className="text-sm font-extrabold text-emerald-700">₹{Math.round(recipe.cost_inr)}</div>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-gray-500">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              Prep
            </div>
            <div className="text-sm font-extrabold text-gray-900">{recipe.prep_time} min</div>
          </div>
        </div>

        {/* Macros Mini Bar */}
        <div className="flex justify-between text-[11px] text-gray-600 px-1 mt-2">
          <span>Protein: <b>{recipe.protein}g</b></span>
          <span>Carbs: <b>{recipe.carbs}g</b></span>
          <span>Fat: <b>{recipe.fat}g</b></span>
        </div>

        {/* Ingredients preview */}
        <div className="mt-3">
          <div className="text-[11px] font-medium text-gray-400 mb-1">Key Ingredients:</div>
          <div className="flex flex-wrap gap-1">
            {recipe.ingredient_tokens.slice(0, 4).map((t, i) => (
              <span
                key={i}
                className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium"
              >
                {t}
              </span>
            ))}
            {recipe.ingredient_tokens.length > 4 && (
              <span className="text-[10px] text-gray-400 self-center">
                +{recipe.ingredient_tokens.length - 4} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-gray-50/80 border-t border-amber-50 space-y-2.5">
        {/* Buttons: Why this meal & View Recipe */}
        <div className="flex gap-2">
          <button
            onClick={() => onOpenExplanation(recipe, explanation)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
            Why this meal?
          </button>
          <button
            onClick={() => onOpenRecipe(recipe)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-gray-500" />
            Recipe
          </button>
        </div>

        {/* Like & Dislike Buttons with Feedback state */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onLike(recipe.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              feedback === 'like'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-500/20'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${feedback === 'like' ? 'fill-current' : ''}`} />
            {feedback === 'like' ? 'Liked' : 'Like'}
          </button>

          <button
            onClick={() => onDislike(recipe.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              feedback === 'dislike'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25 ring-2 ring-rose-500/20'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
            }`}
          >
            <ThumbsDown className={`w-3.5 h-3.5 ${feedback === 'dislike' ? 'fill-current' : ''}`} />
            {feedback === 'dislike' ? 'Disliked' : 'Dislike'}
          </button>
        </div>
      </div>
    </div>
  );
};
