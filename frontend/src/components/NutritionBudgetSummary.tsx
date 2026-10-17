import React from 'react';
import type { MealPlanResponse } from '../types';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { Flame, IndianRupee, PieChart as PieIcon, AlertTriangle, CheckCircle } from 'lucide-react';

interface NutritionBudgetSummaryProps {
  plan: MealPlanResponse;
}

export const NutritionBudgetSummary: React.FC<NutritionBudgetSummaryProps> = ({ plan }) => {
  // Macronutrient breakdown data for Donut Chart
  const macroData = [
    { name: 'Protein (g)', value: plan.total_protein, color: '#10b981' },
    { name: 'Carbs (g)', value: plan.total_carbs, color: '#f59e0b' },
    { name: 'Fat (g)', value: plan.total_fat, color: '#ef4444' },
  ];

  const totalMacroGrams = plan.total_protein + plan.total_carbs + plan.total_fat || 1;
  const pPct = Math.round((plan.total_protein / totalMacroGrams) * 100);
  const cPct = Math.round((plan.total_carbs / totalMacroGrams) * 100);
  const fPct = Math.round((plan.total_fat / totalMacroGrams) * 100);

  // Per-meal cost breakdown for stacked / group bar
  const mealCostData = plan.meal_plan.map((m) => ({
    name: m.name.length > 15 ? m.name.substring(0, 15) + '...' : m.name,
    category: m.meal_category,
    cost: m.cost_inr,
    calories: m.calories,
  }));

  const calPct = Math.min(100, Math.round((plan.total_calories / (plan.calorie_target || 1)) * 100));
  const budgetPct = Math.min(100, Math.round((plan.total_cost_inr / (plan.budget_target || 1)) * 100));

  return (
    <div className="bg-white rounded-3xl border border-amber-100 shadow-md p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-50 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            Nutrition & Budget Analytical Overview
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time validation against daily caloric goals and Indian Rupee budget allocations
          </p>
        </div>

        {/* Global Warnings / Health Flags */}
        <div className="flex flex-wrap gap-2">
          {plan.budget_status === 'within_budget' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5" />
              Within Budget (₹{Math.round(plan.total_cost_inr)} / ₹{Math.round(plan.budget_target)})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              Over Budget (₹{Math.round(plan.total_cost_inr)} / ₹{Math.round(plan.budget_target)})
            </span>
          )}

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            {Math.round(plan.total_calories)} / {Math.round(plan.calorie_target)} kcal ({calPct}%)
          </span>
        </div>
      </div>

      {/* Progress Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calorie Gauge */}
        <div className="p-5 rounded-2xl bg-orange-50/40 border border-orange-100 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-500" />
              Calorie Target Progress
            </span>
            <span className="text-xs font-extrabold text-orange-600">
              {Math.round(plan.total_calories)} / {Math.round(plan.calorie_target)} kcal
            </span>
          </div>

          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                calPct > 110 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'
              }`}
              style={{ width: `${Math.min(100, calPct)}%` }}
            />
          </div>

          <div className="text-[11px] text-gray-500 flex justify-between">
            <span>0 kcal</span>
            <span>Target: {plan.calorie_target} kcal</span>
          </div>
        </div>

        {/* Budget Gauge */}
        <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              Daily Budget Usage (INR)
            </span>
            <span className="text-xs font-extrabold text-emerald-700">
              ₹{Math.round(plan.total_cost_inr)} / ₹{Math.round(plan.budget_target)}
            </span>
          </div>

          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetPct > 100 ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'
              }`}
              style={{ width: `${Math.min(100, budgetPct)}%` }}
            />
          </div>

          <div className="text-[11px] text-gray-500 flex justify-between">
            <span>₹0</span>
            <span>Limit: ₹{plan.budget_target}</span>
          </div>
        </div>
      </div>

      {/* Charts Section: Donut + Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Macro Donut Chart */}
        <div className="lg:col-span-1 p-5 rounded-2xl border border-gray-100 bg-gray-50/60 flex flex-col items-center justify-between">
          <div className="w-full text-left">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-amber-500" />
              Macronutrient Distribution
            </h3>
            <p className="text-[11px] text-gray-500">Total {Math.round(totalMacroGrams)}g macronutrients</p>
          </div>

          <div className="w-full h-44 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macroData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={68}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {macroData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${Math.round(Number(value) || 0)}g`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Macro Legend */}
          <div className="grid grid-cols-3 w-full gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-900 font-semibold border border-emerald-100">
              <div className="text-[10px] text-emerald-600 font-bold">PROTEIN</div>
              <div>{Math.round(plan.total_protein)}g</div>
              <div className="text-[10px] text-gray-500">({pPct}%)</div>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-900 font-semibold border border-amber-100">
              <div className="text-[10px] text-amber-600 font-bold">CARBS</div>
              <div>{Math.round(plan.total_carbs)}g</div>
              <div className="text-[10px] text-gray-500">({cPct}%)</div>
            </div>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-900 font-semibold border border-rose-100">
              <div className="text-[10px] text-rose-600 font-bold">FAT</div>
              <div>{Math.round(plan.total_fat)}g</div>
              <div className="text-[10px] text-gray-500">({fPct}%)</div>
            </div>
          </div>
        </div>

        {/* Meal-by-Meal Cost & Calorie Contribution */}
        <div className="lg:col-span-2 p-5 rounded-2xl border border-gray-100 bg-gray-50/60 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Meal Allocation Breakdown</h3>
            <p className="text-[11px] text-gray-500">Cost (INR) & Calorie contribution per meal slot</p>
          </div>

          <div className="w-full h-52 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mealCostData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" orientation="left" stroke="#f97316" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === 'calories' ? `${Math.round(Number(val) || 0)} kcal` : `₹${Math.round(Number(val) || 0)}`,
                    name === 'calories' ? 'Calories' : 'Cost (INR)',
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="calories" fill="#f97316" name="Calories" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="cost" fill="#10b981" name="Cost (INR)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-xs text-gray-500 text-center">
            {plan.meal_plan.length} balanced meals selected across requested slots
          </div>
        </div>
      </div>
    </div>
  );
};
