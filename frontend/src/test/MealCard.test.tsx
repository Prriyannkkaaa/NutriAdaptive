import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MealCard } from '../components/MealCard';
import type { Recipe, MealExplanation } from '../types';

const mockRecipe: Recipe = {
  id: 'rec_001',
  name: 'Kanda Poha with Peanuts',
  cuisine: 'Indian',
  meal_category: 'breakfast',
  dietary_classification: 'vegan',
  cost_inr: 35.0,
  calories: 280,
  protein: 6.5,
  carbs: 48.0,
  fat: 7.5,
  prep_time: 20,
  ingredients: ['1.5 cups Poha', '2 tbsp Peanuts'],
  ingredient_tokens: ['poha', 'peanuts'],
  allergens: ['peanuts'],
  instructions: ['Rinse poha', 'Cook with spices'],
};

const mockExplanation: MealExplanation = {
  recipe_id: 'rec_001',
  recipe_name: 'Kanda Poha with Peanuts',
  ingredient_match_pct: 100,
  matched_ingredients: ['poha', 'peanuts'],
  cuisine_match: true,
  budget_fit: '₹35 within budget',
  calorie_fit: '280 kcal on target',
  feedback_influence: 'Neutral prior',
  total_score: 0.88,
  breakdown: {
    ingredient: 0.9,
    cuisine: 1.0,
    calories: 0.85,
    budget: 0.9,
    macro: 0.7,
    feedback: 0.5,
  },
};

describe('MealCard Component', () => {
  it('renders meal card with correct name, calories, cost in INR, and tags', () => {
    render(
      <MealCard
        recipe={mockRecipe}
        explanation={mockExplanation}
        onLike={vi.fn()}
        onDislike={vi.fn()}
        onOpenExplanation={vi.fn()}
        onOpenRecipe={vi.fn()}
      />
    );

    expect(screen.getByText('Kanda Poha with Peanuts')).toBeInTheDocument();
    expect(screen.getByText('breakfast')).toBeInTheDocument();
    expect(screen.getByText('vegan')).toBeInTheDocument();
    expect(screen.getByText('280 kcal')).toBeInTheDocument();
    expect(screen.getByText('₹35')).toBeInTheDocument();
    expect(screen.getByText('20 min')).toBeInTheDocument();
  });

  it('triggers like callback on clicking Like button', () => {
    const handleLike = vi.fn();
    render(
      <MealCard
        recipe={mockRecipe}
        explanation={mockExplanation}
        onLike={handleLike}
        onDislike={vi.fn()}
        onOpenExplanation={vi.fn()}
        onOpenRecipe={vi.fn()}
      />
    );

    const likeBtn = screen.getByRole('button', { name: /^Like$/i });
    fireEvent.click(likeBtn);
    expect(handleLike).toHaveBeenCalledWith('rec_001');
  });

  it('triggers dislike callback on clicking Dislike button', () => {
    const handleDislike = vi.fn();
    render(
      <MealCard
        recipe={mockRecipe}
        explanation={mockExplanation}
        onLike={vi.fn()}
        onDislike={handleDislike}
        onOpenExplanation={vi.fn()}
        onOpenRecipe={vi.fn()}
      />
    );

    const dislikeBtn = screen.getByRole('button', { name: /^Dislike$/i });
    fireEvent.click(dislikeBtn);
    expect(handleDislike).toHaveBeenCalledWith('rec_001');
  });

  it('opens explanation modal on clicking Why this meal button', () => {
    const handleOpenExp = vi.fn();
    render(
      <MealCard
        recipe={mockRecipe}
        explanation={mockExplanation}
        onLike={vi.fn()}
        onDislike={vi.fn()}
        onOpenExplanation={handleOpenExp}
        onOpenRecipe={vi.fn()}
      />
    );

    const expBtn = screen.getByRole('button', { name: /Why this meal\?/i });
    fireEvent.click(expBtn);
    expect(handleOpenExp).toHaveBeenCalledWith(mockRecipe, mockExplanation);
  });
});
