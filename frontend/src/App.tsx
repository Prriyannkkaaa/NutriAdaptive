import { useState, useEffect } from 'react';
import type {
  UserPreferences,
  MealPlanResponse,
  FeedbackRecord,
} from './types';
import {
  fetchHealth,
  fetchPreferences,
  savePreferences,
  generateRecommendations,
  submitFeedback,
  fetchFeedbackHistory,
} from './services/api';
import { Navbar } from './components/Navbar';
import { WelcomeView } from './components/WelcomeView';
import { PreferencesForm } from './components/PreferencesForm';
import { DashboardView } from './components/DashboardView';
import { FeedbackHistoryView } from './components/FeedbackHistoryView';
import { RecipeCatalogView } from './components/RecipeCatalogView';

export function App() {
  const [currentTab, setCurrentTab] = useState<'welcome' | 'preferences' | 'dashboard' | 'history' | 'catalog'>('welcome');
  const [userId, setUserId] = useState<string>('demo-user');
  const [backendHealthy, setBackendHealthy] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const [preferences, setPreferences] = useState<UserPreferences>({
    user_id: 'demo-user',
    age: 24,
    dietary_preference: 'vegetarian',
    allergies: [],
    available_ingredients: ['paneer', 'rice', 'tomato', 'onion', 'wheat flour', 'ghee'],
    daily_budget_inr: 220.0,
    daily_calorie_target: 1800.0,
    preferred_cuisines: ['North Indian', 'South Indian', 'Italian'],
    meal_categories: ['breakfast', 'lunch', 'dinner'],
  });

  const [plan, setPlan] = useState<MealPlanResponse | null>(null);
  const [userFeedbackMap, setUserFeedbackMap] = useState<Record<string, 'like' | 'dislike'>>({});
  const [lastFeedbackNotice, setLastFeedbackNotice] = useState<string | null>(null);

  // Check health and initialize user data
  useEffect(() => {
    fetchHealth()
      .then((h) => setBackendHealthy(h.status === 'healthy'))
      .catch(() => setBackendHealthy(false));

    loadUserData(userId);
  }, [userId]);

  const loadUserData = async (uid: string) => {
    try {
      const pref = await fetchPreferences(uid);
      setPreferences(pref);

      const fbHistory = await fetchFeedbackHistory(uid);
      const fbMap: Record<string, 'like' | 'dislike'> = {};
      fbHistory.history.forEach((f: FeedbackRecord) => {
        fbMap[f.recipe_id] = f.feedback_type;
      });
      setUserFeedbackMap(fbMap);
    } catch (err) {
      console.warn('Initial load fallback:', err);
    }
  };

  const handleSaveAndGenerate = async (newPref: UserPreferences) => {
    setLoading(true);
    try {
      const saved = await savePreferences({ ...newPref, user_id: userId });
      setPreferences(saved);

      const newPlan = await generateRecommendations(userId, saved);
      setPlan(newPlan);
      setCurrentTab('dashboard');
    } catch (err: any) {
      alert(`Error generating plan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      // Pass currently shown recipe IDs if user wants a brand fresh variant
      const excludeIds = plan ? plan.meal_plan.map((m) => m.id) : [];
      const newPlan = await generateRecommendations(userId, preferences, excludeIds);
      setPlan(newPlan);
      setLastFeedbackNotice('Meal plan regenerated incorporating your latest liked and disliked preferences!');
      setTimeout(() => setLastFeedbackNotice(null), 5000);
    } catch (err: any) {
      alert(`Error regenerating plan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeMeal = async (recipeId: string) => {
    try {
      await submitFeedback(userId, recipeId, 'like');
      setUserFeedbackMap((prev) => ({ ...prev, [recipeId]: 'like' }));
      const meal = plan?.meal_plan.find((m) => m.id === recipeId);
      setLastFeedbackNotice(
        `Liked "${meal?.name || recipeId}"! Saved in SQLite. The engine will boost similar ${meal?.cuisine || ''} meals on regenerate.`
      );
    } catch (err: any) {
      alert(`Failed to save feedback: ${err.message}`);
    }
  };

  const handleDislikeMeal = async (recipeId: string) => {
    try {
      await submitFeedback(userId, recipeId, 'dislike');
      setUserFeedbackMap((prev) => ({ ...prev, [recipeId]: 'dislike' }));
      const meal = plan?.meal_plan.find((m) => m.id === recipeId);
      setLastFeedbackNotice(
        `Disliked "${meal?.name || recipeId}". Saved in SQLite. This recipe and similar meals will be suppressed on regenerate.`
      );
    } catch (err: any) {
      alert(`Failed to save feedback: ${err.message}`);
    }
  };

  const handleSelectPreset = (preset: UserPreferences) => {
    setUserId(preset.user_id);
    handleSaveAndGenerate(preset);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col font-sans selection:bg-amber-200 selection:text-amber-900">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        userId={userId}
        setUserId={setUserId}
        backendHealthy={backendHealthy}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {currentTab === 'welcome' && (
          <WelcomeView
            onSelectPreset={handleSelectPreset}
            onGetStarted={() => setCurrentTab('preferences')}
          />
        )}

        {currentTab === 'preferences' && (
          <PreferencesForm
            initialPreferences={preferences}
            onSaveAndGenerate={handleSaveAndGenerate}
            loading={loading}
          />
        )}

        {currentTab === 'dashboard' && (
          <DashboardView
            plan={plan}
            loading={loading}
            onRegenerate={handleRegenerate}
            onLikeMeal={handleLikeMeal}
            onDislikeMeal={handleDislikeMeal}
            userFeedbackMap={userFeedbackMap}
            onGoToPreferences={() => setCurrentTab('preferences')}
            lastFeedbackNotice={lastFeedbackNotice}
          />
        )}

        {currentTab === 'history' && (
          <FeedbackHistoryView
            userId={userId}
            onRefreshTrigger={() => {
              setUserFeedbackMap({});
              if (plan) handleRegenerate();
            }}
          />
        )}

        {currentTab === 'catalog' && <RecipeCatalogView />}
      </main>

      <footer className="border-t border-amber-100 bg-white/60 py-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Personalized Meal Recommendation System with Feedback-Based Learning</span>
          <span>College-Level ML Project • Built with React, FastAPI, SQLite & Scikit-Learn</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
