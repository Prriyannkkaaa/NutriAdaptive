import React, { useState, useEffect } from 'react';
import type { UserPreferences } from '../types';
import {
  Sliders,
  AlertCircle,
  Plus,
  X,
  IndianRupee,
  Flame,
  Check,
  UtensilsCrossed,
  ShieldAlert,
} from 'lucide-react';
import { fetchCommonIngredients } from '../services/api';

interface PreferencesFormProps {
  initialPreferences: UserPreferences;
  onSaveAndGenerate: (preferences: UserPreferences) => Promise<void>;
  loading: boolean;
}

export const PreferencesForm: React.FC<PreferencesFormProps> = ({
  initialPreferences,
  onSaveAndGenerate,
  loading,
}) => {
  const [preferences, setPreferences] = useState<UserPreferences>(initialPreferences);
  const [ingredientInput, setIngredientInput] = useState('');
  const [popularIngredients, setPopularIngredients] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    setPreferences(initialPreferences);
  }, [initialPreferences]);

  useEffect(() => {
    fetchCommonIngredients().then((list) => {
      if (list.length > 0) setPopularIngredients(list.slice(0, 16));
    });
  }, []);

  const ALLERGEN_OPTIONS = [
    { id: 'dairy', label: 'Dairy (Milk, Paneer, Ghee, Curd)' },
    { id: 'gluten', label: 'Gluten (Wheat, Maida, Roti, Bread)' },
    { id: 'nuts', label: 'Tree Nuts (Cashews, Almonds, Walnuts)' },
    { id: 'peanuts', label: 'Peanuts' },
    { id: 'eggs', label: 'Eggs' },
    { id: 'soy', label: 'Soy & Tofu' },
    { id: 'fish', label: 'Fish' },
    { id: 'shellfish', label: 'Shellfish (Prawns, Shrimp)' },
    { id: 'mustard', label: 'Mustard Seeds / Oil' },
    { id: 'sesame', label: 'Sesame (Til)' },
  ];

  const CUISINE_OPTIONS = [
    'North Indian',
    'South Indian',
    'Indian',
    'Italian',
    'Chinese',
    'Continental',
  ];

  const MEAL_SLOT_OPTIONS = [
    { id: 'breakfast', label: 'Breakfast' },
    { id: 'lunch', label: 'Lunch' },
    { id: 'snacks', label: 'Evening Snacks' },
    { id: 'dinner', label: 'Dinner' },
  ];

  const DIETARY_OPTIONS = [
    { id: 'vegetarian', label: 'Vegetarian', desc: 'No meat, seafood, or eggs' },
    { id: 'vegan', label: 'Vegan', desc: '100% plant-based, no dairy or animal products' },
    { id: 'eggetarian', label: 'Eggetarian', desc: 'Vegetarian plus eggs' },
    { id: 'non-vegetarian', label: 'Non-Vegetarian', desc: 'Includes chicken, fish, seafood & meats' },
  ];

  const handleAddIngredient = (tag: string) => {
    const clean = tag.trim().toLowerCase();
    if (clean && !preferences.available_ingredients.includes(clean)) {
      setPreferences({
        ...preferences,
        available_ingredients: [...preferences.available_ingredients, clean],
      });
      setIngredientInput('');
    }
  };

  const handleRemoveIngredient = (tag: string) => {
    setPreferences({
      ...preferences,
      available_ingredients: preferences.available_ingredients.filter((t) => t !== tag),
    });
  };

  const toggleAllergy = (allergyId: string) => {
    const exists = preferences.allergies.includes(allergyId);
    setPreferences({
      ...preferences,
      allergies: exists
        ? preferences.allergies.filter((a) => a !== allergyId)
        : [...preferences.allergies, allergyId],
    });
  };

  const toggleCuisine = (cuisine: string) => {
    const exists = preferences.preferred_cuisines.includes(cuisine);
    setPreferences({
      ...preferences,
      preferred_cuisines: exists
        ? preferences.preferred_cuisines.filter((c) => c !== cuisine)
        : [...preferences.preferred_cuisines, cuisine],
    });
  };

  const toggleMealSlot = (slot: string) => {
    const exists = preferences.meal_categories.includes(slot);
    if (exists && preferences.meal_categories.length === 1) {
      setValidationError('At least one meal category must remain selected.');
      return;
    }
    setValidationError(null);
    setPreferences({
      ...preferences,
      meal_categories: exists
        ? preferences.meal_categories.filter((s) => s !== slot)
        : [...preferences.meal_categories, slot],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (preferences.age < 1 || preferences.age > 120) {
      setValidationError('Please enter a valid age between 1 and 120.');
      return;
    }
    if (preferences.daily_budget_inr <= 0) {
      setValidationError('Please specify a positive daily food budget in INR.');
      return;
    }
    if (preferences.daily_calorie_target < 800 || preferences.daily_calorie_target > 5000) {
      setValidationError('Daily calorie target should realistically be between 800 and 5000 kcal.');
      return;
    }
    if (preferences.meal_categories.length === 0) {
      setValidationError('Please select at least one meal category.');
      return;
    }

    setValidationError(null);
    onSaveAndGenerate(preferences);
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="bg-white rounded-3xl border border-amber-100 shadow-xl overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-8 py-8 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Personalized Dietary Preferences
              </h2>
              <p className="text-amber-100 text-sm mt-0.5">
                Set hard constraints, caloric targets, INR budgets, and available kitchen pantry ingredients
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
          {validationError && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* 1. Age & Dietary Preference */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1.5">
                Age (Years)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={preferences.age}
                onChange={(e) =>
                  setPreferences({ ...preferences, age: parseInt(e.target.value) || 25 })
                }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-gray-900 font-medium"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-800 mb-1.5">
                Dietary Classification <span className="text-rose-500">*Hard Constraint</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {DIETARY_OPTIONS.map((d) => (
                  <button
                    type="button"
                    key={d.id}
                    onClick={() => setPreferences({ ...preferences, dietary_preference: d.id })}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      preferences.dietary_preference === d.id
                        ? 'border-amber-500 bg-amber-50/80 text-amber-950 font-semibold ring-2 ring-amber-500/20'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-xs font-bold capitalize">{d.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Daily Calorie Target & Daily Budget INR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-amber-50/50 border border-amber-100">
            {/* Calorie Target */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Daily Calorie Target (kcal)
                </label>
                <span className="text-base font-extrabold text-orange-600">
                  {preferences.daily_calorie_target} kcal
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="4000"
                step="50"
                value={preferences.daily_calorie_target}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    daily_calorie_target: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-orange-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-gray-400 mt-1 font-medium">
                <span>1000 kcal (Deficit)</span>
                <span>2000 kcal (Standard)</span>
                <span>4000 kcal (Bulk)</span>
              </div>
            </div>

            {/* Daily Budget INR */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                  <IndianRupee className="w-4 h-4 text-emerald-600" />
                  Daily Food Budget (INR ₹)
                </label>
                <span className="text-base font-extrabold text-emerald-700">
                  ₹{preferences.daily_budget_inr}
                </span>
              </div>
              <div className="flex gap-2 mb-2">
                {[150, 250, 350, 500].map((b) => (
                  <button
                    type="button"
                    key={b}
                    onClick={() => setPreferences({ ...preferences, daily_budget_inr: b })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                      preferences.daily_budget_inr === b
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    ₹{b}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="50"
                max="3000"
                value={preferences.daily_budget_inr}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    daily_budget_inr: parseFloat(e.target.value) || 200,
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              />
            </div>
          </div>

          {/* 3. Allergies & Dietary Restrictions */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <label className="text-sm font-bold text-gray-900">
                Food Allergies & Exclusions{' '}
                <span className="text-xs font-normal text-gray-500">
                  (Strict Hard Constraints: Any recipe containing these will be excluded)
                </span>
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {ALLERGEN_OPTIONS.map((a) => {
                const checked = preferences.allergies.includes(a.id);
                return (
                  <button
                    type="button"
                    key={a.id}
                    onClick={() => toggleAllergy(a.id)}
                    className={`p-2.5 rounded-xl border text-xs text-left cursor-pointer transition-all flex items-center justify-between ${
                      checked
                        ? 'bg-rose-50 border-rose-400 text-rose-900 font-bold'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{a.label.split(' ')[0]}</span>
                    {checked && <Check className="w-3.5 h-3.5 text-rose-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Preferred Cuisines */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Preferred Cuisines
            </label>
            <div className="flex flex-wrap gap-2">
              {CUISINE_OPTIONS.map((c) => {
                const selected = preferences.preferred_cuisines.includes(c);
                return (
                  <button
                    type="button"
                    key={c}
                    onClick={() => toggleCuisine(c)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all ${
                      selected
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Number of Meals per Day & Slots */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Select Meal Slots for the Day
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {MEAL_SLOT_OPTIONS.map((slot) => {
                const selected = preferences.meal_categories.includes(slot.id);
                return (
                  <button
                    type="button"
                    key={slot.id}
                    onClick={() => toggleMealSlot(slot.id)}
                    className={`p-3.5 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                      selected
                        ? 'bg-orange-50 border-orange-400 text-orange-950 font-bold ring-2 ring-orange-500/20'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <UtensilsCrossed className={`w-4 h-4 ${selected ? 'text-orange-600' : 'text-gray-400'}`} />
                    <span className="text-xs">{slot.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Available Ingredients (Searchable Tags) */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-1.5">
              Available Kitchen Ingredients{' '}
              <span className="text-xs font-normal text-gray-500">
                (The recommendation engine awards higher compatibility scores to recipes matching your pantry)
              </span>
            </label>

            {/* Input + add */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Type ingredient (e.g. paneer, potato, tomato) and press Enter"
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddIngredient(ingredientInput);
                  }
                }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-sm"
              />
              <button
                type="button"
                onClick={() => handleAddIngredient(ingredientInput)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-xs flex items-center gap-1 hover:bg-amber-600 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {/* Active Tags */}
            {preferences.available_ingredients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                {preferences.available_ingredients.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-amber-900 text-xs font-medium shadow-2xs"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(tag)}
                      className="text-gray-400 hover:text-rose-500 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Popular Quick Suggestions */}
            {popularIngredients.length > 0 && (
              <div className="text-xs text-gray-500 space-y-1">
                <span>Quick add common staples: </span>
                <div className="flex flex-wrap gap-1 pt-1">
                  {popularIngredients.map((ing) => {
                    const alreadyAdded = preferences.available_ingredients.includes(ing);
                    if (alreadyAdded) return null;
                    return (
                      <button
                        type="button"
                        key={ing}
                        onClick={() => handleAddIngredient(ing)}
                        className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-amber-100 hover:text-amber-900 text-[11px] text-gray-700 transition-colors cursor-pointer"
                      >
                        + {ing}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-bold text-base shadow-lg shadow-orange-500/25 hover:from-amber-600 hover:to-orange-600 active:scale-98 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Optimal Plan...
                </>
              ) : (
                <>
                  <UtensilsCrossed className="w-5 h-5" />
                  Save Preferences & Generate Meal Plan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
