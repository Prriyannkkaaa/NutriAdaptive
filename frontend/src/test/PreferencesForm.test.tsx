import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PreferencesForm } from '../components/PreferencesForm';
import type { UserPreferences } from '../types';

vi.mock('../services/api', () => ({
  fetchCommonIngredients: vi.fn().mockResolvedValue(['paneer', 'rice', 'tomato', 'potato']),
}));

const defaultPref: UserPreferences = {
  user_id: 'test-user',
  age: 24,
  dietary_preference: 'vegetarian',
  allergies: [],
  available_ingredients: ['paneer', 'rice'],
  daily_budget_inr: 200,
  daily_calorie_target: 1800,
  preferred_cuisines: ['North Indian'],
  meal_categories: ['breakfast', 'lunch', 'dinner'],
};

describe('PreferencesForm Component', () => {
  it('renders with initial values and inputs', () => {
    render(
      <PreferencesForm
        initialPreferences={defaultPref}
        onSaveAndGenerate={vi.fn()}
        loading={false}
      />
    );

    expect(screen.getByDisplayValue('24')).toBeInTheDocument();
    expect(screen.getByText('Vegetarian')).toBeInTheDocument();
    expect(screen.getByText('1800 kcal')).toBeInTheDocument();
    expect(screen.getByText('₹200')).toBeInTheDocument();
    expect(screen.getByText('paneer')).toBeInTheDocument();
    expect(screen.getByText('rice')).toBeInTheDocument();
  });

  it('allows selecting dietary preference and submitting form', () => {
    const handleSave = vi.fn();
    render(
      <PreferencesForm
        initialPreferences={defaultPref}
        onSaveAndGenerate={handleSave}
        loading={false}
      />
    );

    // Switch to Vegan
    const veganBtn = screen.getByRole('button', { name: /Vegan/i });
    fireEvent.click(veganBtn);

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Save Preferences & Generate Meal Plan/i });
    fireEvent.click(submitBtn);

    expect(handleSave).toHaveBeenCalledTimes(1);
    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        dietary_preference: 'vegan',
      })
    );
  });
});
