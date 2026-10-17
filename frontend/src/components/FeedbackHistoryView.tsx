import React, { useState, useEffect } from 'react';
import type {
  FeedbackHistoryResponse,
  MealPlanHistoryRecord,
} from '../types';
import {
  fetchFeedbackHistory,
  fetchRecommendationHistory,
  resetFeedbackHistory,
} from '../services/api';
import {
  History,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Sparkles,
  Calendar,
  Flame,
  IndianRupee,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

interface FeedbackHistoryViewProps {
  userId: string;
  onRefreshTrigger?: () => void;
}

export const FeedbackHistoryView: React.FC<FeedbackHistoryViewProps> = ({
  userId,
  onRefreshTrigger,
}) => {
  const [feedbackData, setFeedbackData] = useState<FeedbackHistoryResponse | null>(null);
  const [planHistory, setPlanHistory] = useState<MealPlanHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fb, hist] = await Promise.all([
        fetchFeedbackHistory(userId),
        fetchRecommendationHistory(userId),
      ]);
      setFeedbackData(fb);
      setPlanHistory(hist.history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleReset = async () => {
    if (confirm(`Reset all learned ratings and feedback for user "${userId}"?`)) {
      try {
        await resetFeedbackHistory(userId);
        setResetMessage('Feedback history successfully wiped to baseline.');
        loadData();
        if (onRefreshTrigger) onRefreshTrigger();
        setTimeout(() => setResetMessage(null), 4000);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-8 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-amber-100 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-2">
            <History className="w-3.5 h-3.5 text-amber-600" />
            Machine Learning Memory & Feedback Ledger
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Learned Preference Profile ({userId})
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Visualizing persistent ratings stored in SQLite and dynamic Rocchio affinity shifts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset Learning
          </button>
        </div>
      </div>

      {resetMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold animate-in fade-in">
          {resetMessage}
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-amber-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ThumbsUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{feedbackData?.total_likes || 0}</div>
            <div className="text-xs font-semibold text-gray-500">Positive Likes</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-amber-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ThumbsDown className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{feedbackData?.total_dislikes || 0}</div>
            <div className="text-xs font-semibold text-gray-500">Negative Dislikes</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-amber-100 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900">{planHistory.length}</div>
            <div className="text-xs font-semibold text-gray-500">Generated Plans</div>
          </div>
        </div>
      </div>

      {/* Learned Affinities Visualizer */}
      {feedbackData && feedbackData.learned_affinity_summary && (
        <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            Active Learned Affinity Vectors
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cuisine Affinities */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                Learned Cuisine Affinity (Δ weight)
              </h3>
              {Object.keys(feedbackData.learned_affinity_summary.cuisine_affinity || {}).length === 0 ? (
                <div className="text-xs text-gray-400 italic p-4 rounded-xl bg-gray-50">
                  No cuisine affinity learned yet. Like or dislike meals to build affinities.
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(feedbackData.learned_affinity_summary.cuisine_affinity || {}).map(
                    ([cuisine, score]) => (
                      <div key={cuisine} className="flex items-center justify-between text-xs p-2 rounded-lg bg-gray-50">
                        <span className="font-semibold text-gray-800">{cuisine}</span>
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                            score > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : score < 0
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Top Liked & Disliked Ingredients */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                Learned Ingredient Tokens
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-[11px] font-bold text-emerald-700">Preferred Tokens:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(feedbackData.learned_affinity_summary.top_liked_ingredients || []).map((t) => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                        +{t}
                      </span>
                    ))}
                    {(feedbackData.learned_affinity_summary.top_liked_ingredients || []).length === 0 && (
                      <span className="text-xs text-gray-400 italic">None yet</span>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-bold text-rose-700">Suppressed Tokens:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(feedbackData.learned_affinity_summary.top_disliked_ingredients || []).map((t) => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 font-medium">
                        -{t}
                      </span>
                    ))}
                    {(feedbackData.learned_affinity_summary.top_disliked_ingredients || []).length === 0 && (
                      <span className="text-xs text-gray-400 italic">None yet</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chronological Feedback Log */}
      <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-gray-900">Historical Feedback Submissions</h2>
        {(!feedbackData || feedbackData.history.length === 0) ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No feedback submitted yet. Like or dislike meal cards on the Meal Plan Dashboard!
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {feedbackData.history.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      item.feedback_type === 'like'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {item.feedback_type === 'like' ? (
                      <ThumbsUp className="w-3.5 h-3.5" />
                    ) : (
                      <ThumbsDown className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <div>
                    <div className="font-bold text-gray-900">{item.recipe_name || item.recipe_id}</div>
                    <div className="text-xs text-gray-400">
                      {item.cuisine} • {item.meal_category} • {item.timestamp?.split('T')[0]}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    item.feedback_type === 'like'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {item.feedback_type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Previously Generated Meal Plans History */}
      <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-500" />
          Previous Meal Plans History
        </h2>

        {planHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No previously generated plans logged yet.
          </div>
        ) : (
          <div className="space-y-3">
            {planHistory.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-gray-800 text-sm mb-1">
                    Plan #{rec.id} • {rec.created_at ? new Date(rec.created_at).toLocaleString() : 'Recent'}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(rec.meals || []).map((m) => (
                      <span key={m.id} className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-700">
                        {m.meal_category}: <b>{m.name}</b>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="flex items-center gap-1 font-semibold text-orange-600">
                    <Flame className="w-3.5 h-3.5" />
                    {Math.round(rec.total_calories)} kcal
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-600">
                    <IndianRupee className="w-3.5 h-3.5" />
                    ₹{Math.round(rec.total_cost_inr)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
