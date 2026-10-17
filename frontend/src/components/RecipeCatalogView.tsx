import React, { useState, useEffect } from 'react';
import type { Recipe } from '../types';
import { fetchRecipes } from '../services/api';
import { RecipeModal } from './RecipeModal';
import { Search, BookOpen, Flame, IndianRupee, Clock, Eye } from 'lucide-react';

export const RecipeCatalogView: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('');
  const [cuisine, setCuisine] = useState<string>('');
  const [diet, setDiet] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const data = await fetchRecipes({
        search: search.trim() || undefined,
        category: category || undefined,
        cuisine: cuisine || undefined,
        diet: diet || undefined,
        limit: 100,
      });
      setRecipes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRecipes();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, category, cuisine, diet]);

  const CUISINES = ['North Indian', 'South Indian', 'Indian', 'Italian', 'Chinese', 'Continental'];
  const CATEGORIES = ['breakfast', 'lunch', 'snacks', 'dinner'];
  const DIETS = ['vegan', 'vegetarian', 'eggetarian', 'non-vegetarian'];

  return (
    <div className="space-y-6 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold mb-2">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            200 Realistic Recipes Dataset
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Recipe Catalog Explorer</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Browse through authentic Indian and global recipes with exact nutritional breakdown and INR cost estimates.
          </p>
        </div>

        <div className="text-xs font-bold text-gray-700 bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-200 self-start md:self-auto">
          Showing <span className="text-amber-600">{recipes.length}</span> recipes
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search recipes or ingredients (e.g. paneer, biryani, pasta)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Category Select */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.toUpperCase()}
                </option>
              ))}
            </select>

            {/* Cuisine Select */}
            <select
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white"
            >
              <option value="">All Cuisines</option>
              {CUISINES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Diet Select */}
            <select
              value={diet}
              onChange={(e) => setDiet(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-white"
            >
              <option value="">All Diets</option>
              {DIETS.map((d) => (
                <option key={d} value={d}>
                  {d.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Recipe Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-gray-400">Loading catalog...</div>
      ) : recipes.length === 0 ? (
        <div className="py-16 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
          No recipes match current filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {recipes.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl border border-amber-100 shadow-2xs hover:shadow-md transition-all p-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                    {r.meal_category}
                  </span>
                  <span className="font-bold text-gray-500 capitalize">{r.dietary_classification}</span>
                </div>

                <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{r.name}</h3>

                <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
                  <span className="flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    {Math.round(r.calories)} kcal
                  </span>
                  <span className="flex items-center gap-1 font-bold text-emerald-700">
                    <IndianRupee className="w-3.5 h-3.5" />
                    ₹{Math.round(r.cost_inr)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span>{r.cuisine}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {r.prep_time}m
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedRecipe(r)}
                className="mt-3 w-full py-1.5 rounded-xl bg-gray-50 hover:bg-amber-50 text-gray-700 hover:text-amber-900 font-semibold text-xs border border-gray-200 hover:border-amber-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                View Recipe
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recipe Modal */}
      <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
    </div>
  );
};
