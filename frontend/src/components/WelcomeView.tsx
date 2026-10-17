import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, HeartHandshake, Cpu, Flame } from 'lucide-react';
import type { UserPreferences } from '../types';

interface WelcomeViewProps {
  onSelectPreset: (preset: UserPreferences) => void;
  onGetStarted: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onSelectPreset, onGetStarted }) => {
  const PRESETS: Array<{
    title: string;
    badge: string;
    tagline: string;
    icon: string;
    data: UserPreferences;
  }> = [
    {
      title: 'College Student on a Budget',
      badge: '₹160 / day',
      tagline: 'Economical, fast-prep homestyle vegetarian meals with pantry staples.',
      icon: '🎓',
      data: {
        user_id: 'student-demo',
        age: 21,
        dietary_preference: 'vegetarian',
        allergies: [],
        available_ingredients: ['rice', 'poha', 'moong dal', 'onion', 'tomato', 'potato'],
        daily_budget_inr: 160.0,
        daily_calorie_target: 1750.0,
        preferred_cuisines: ['Indian', 'North Indian'],
        meal_categories: ['breakfast', 'lunch', 'dinner'],
      },
    },
    {
      title: 'High-Protein Fitness Athlete',
      badge: '2400 kcal | ₹320 / day',
      tagline: 'Targeted protein density with eggs, chicken, and high-energy complex carbs.',
      icon: '🏋️',
      data: {
        user_id: 'athlete-demo',
        age: 26,
        dietary_preference: 'non-vegetarian',
        allergies: [],
        available_ingredients: ['chicken', 'eggs', 'quinoa', 'broccoli', 'oats', 'milk'],
        daily_budget_inr: 320.0,
        daily_calorie_target: 2400.0,
        preferred_cuisines: ['Continental', 'North Indian'],
        meal_categories: ['breakfast', 'lunch', 'snacks', 'dinner'],
      },
    },
    {
      title: 'South Indian Vegan (Allergy-Safe)',
      badge: 'Dairy-Free | Gluten-Free',
      tagline: 'Authentic fermented dosas, idlis, sambar and nutritious vegetable stews.',
      icon: '🌿',
      data: {
        user_id: 'vegan-demo',
        age: 29,
        dietary_preference: 'vegan',
        allergies: ['dairy', 'gluten'],
        available_ingredients: ['rice', 'urad dal', 'drumstick', 'coconut', 'mustard seeds', 'tomato'],
        daily_budget_inr: 200.0,
        daily_calorie_target: 1800.0,
        preferred_cuisines: ['South Indian'],
        meal_categories: ['breakfast', 'lunch', 'dinner'],
      },
    },
    {
      title: 'Global Foodie (Indian & Italian)',
      badge: '₹280 / day',
      tagline: 'Fusion of rich North Indian curries and classic Italian pastas.',
      icon: '🍝',
      data: {
        user_id: 'foodie-demo',
        age: 24,
        dietary_preference: 'vegetarian',
        allergies: [],
        available_ingredients: ['paneer', 'tomatoes', 'pasta', 'garlic', 'basil', 'olive oil'],
        daily_budget_inr: 280.0,
        daily_calorie_target: 2100.0,
        preferred_cuisines: ['North Indian', 'Italian'],
        meal_categories: ['breakfast', 'lunch', 'snacks', 'dinner'],
      },
    },
  ];

  return (
    <div className="space-y-12 py-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-900 via-orange-900 to-amber-950 text-white p-8 md:p-14 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-amber-200 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-amber-300" />
            Machine Learning Engineering & Full-Stack System
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white">
            Personalized Meal Recommendation System{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-orange-400">
              with Feedback-Based Learning
            </span>
          </h1>

          <p className="text-base sm:text-lg text-amber-100/90 leading-relaxed font-normal">
            An intelligent nutrition engine combining strict allergy constraints, TF-IDF ingredient
            matching, multi-criteria utility ranking, and persistent Rocchio feedback adaptation in Indian Rupees (INR).
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg shadow-orange-500/30 hover:from-amber-600 hover:to-orange-600 active:scale-98 transition-all"
            >
              Configure Custom Preferences
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Core Architectural Pillars */}
      <div>
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-gray-900">How the Recommendation Engine Works</h2>
          <p className="text-sm text-gray-500 mt-1">
            End-to-end transparent pipeline: mathematical scoring, zero black boxes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">1. Hard Constraint Filter</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Guarantees zero allergen contamination (dairy, gluten, nuts, etc.) and enforces strict dietary
              classifications (vegan, vegetarian, eggetarian).
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">2. Multi-Attribute Scoring</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Calculates cosine similarity on available kitchen ingredients, Gaussian caloric proximity, and
              asymmetric budget penalty functions.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">3. Daily Plan Assembly</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Balances calories and INR budget across breakfast, lunch, snacks, and dinner with inter-meal
              ingredient diversity penalization.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-amber-100 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-1">4. Feedback Learning Loop</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Likes and dislikes update user affinity vectors in SQLite. Rocchio centroid shifts dynamically
              boost similar recipes and suppress disliked meals.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Demo Presets */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Try Instant Demo Profiles</h2>
            <p className="text-sm text-gray-500">
              Select any curated preset to immediately test recommendations and observe feedback-based learning
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PRESETS.map((preset, idx) => (
            <div
              key={idx}
              className="group bg-white rounded-2xl p-5 border border-amber-100/80 shadow-xs hover:border-amber-400 hover:shadow-lg transition-all flex flex-col justify-between text-left"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{preset.icon}</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    {preset.badge}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-base group-hover:text-amber-700 transition-colors">
                  {preset.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">{preset.tagline}</p>
                <div className="flex flex-wrap gap-1 text-[11px] text-gray-600 pt-1">
                  <span className="bg-gray-100 px-2 py-0.5 rounded-md">
                    {preset.data.dietary_preference}
                  </span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded-md">
                    {preset.data.meal_categories.length} meals/day
                  </span>
                </div>
              </div>

              <button
                onClick={() => onSelectPreset(preset.data)}
                className="mt-5 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-50 text-amber-900 font-semibold text-xs border border-amber-200 hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-all cursor-pointer"
              >
                Load Profile & Recommend
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
