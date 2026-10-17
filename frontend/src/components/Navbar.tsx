import React from 'react';
import { UtensilsCrossed, Sparkles, Sliders, History, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';

interface NavbarProps {
  currentTab: 'welcome' | 'preferences' | 'dashboard' | 'history' | 'catalog';
  setCurrentTab: (tab: 'welcome' | 'preferences' | 'dashboard' | 'history' | 'catalog') => void;
  userId: string;
  setUserId: (id: string) => void;
  backendHealthy: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  userId,
  setUserId,
  backendHealthy,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-amber-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setCurrentTab('welcome')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-lg tracking-tight">NutriAdaptive</span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  ML Project
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">
                Personalized Meal Recommender with Feedback Learning
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setCurrentTab('welcome')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'welcome'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200/60'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              Overview
            </button>
            <button
              onClick={() => setCurrentTab('preferences')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'preferences'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200/60'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Sliders className="w-4 h-4 text-amber-500" />
              Preferences
            </button>
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'dashboard'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200/60'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4 text-orange-500" />
              Meal Plan
            </button>
            <button
              onClick={() => setCurrentTab('history')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'history'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200/60'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <History className="w-4 h-4 text-amber-600" />
              Learning History
            </button>
            <button
              onClick={() => setCurrentTab('catalog')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'catalog'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200/60'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              200 Recipes
            </button>
          </nav>

          {/* User selector & backend status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              <span className="text-gray-400">User:</span>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value.trim() || 'demo-user')}
                className="w-24 bg-transparent border-none text-xs font-semibold text-gray-800 focus:outline-hidden focus:ring-0"
                title="Change user profile to demonstrate multi-user feedback persistence"
              />
            </div>

            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                backendHealthy
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {backendHealthy ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Engine Online</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden sm:inline">Connecting</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-amber-50 space-x-1">
          <button
            onClick={() => setCurrentTab('welcome')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              currentTab === 'welcome' ? 'bg-amber-100 text-amber-900' : 'text-gray-600'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setCurrentTab('preferences')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              currentTab === 'preferences' ? 'bg-amber-100 text-amber-900' : 'text-gray-600'
            }`}
          >
            Preferences
          </button>
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              currentTab === 'dashboard' ? 'bg-amber-100 text-amber-900' : 'text-gray-600'
            }`}
          >
            Meal Plan
          </button>
          <button
            onClick={() => setCurrentTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              currentTab === 'history' ? 'bg-amber-100 text-amber-900' : 'text-gray-600'
            }`}
          >
            Learning History
          </button>
          <button
            onClick={() => setCurrentTab('catalog')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              currentTab === 'catalog' ? 'bg-amber-100 text-amber-900' : 'text-gray-600'
            }`}
          >
            200 Recipes
          </button>
        </div>
      </div>
    </header>
  );
};
