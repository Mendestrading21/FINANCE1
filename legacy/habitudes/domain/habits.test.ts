import { describe, expect, it } from 'vitest';
import {
  completionRate,
  createHabit,
  currentStreak,
  isCompletedOn,
  lastNDays,
  toggleCompletion,
  type Completion,
} from './habits';

const TODAY = '2026-09-17';

describe('createHabit', () => {
  it('crée une habitude avec un identifiant, le nom nettoyé et la date du jour', () => {
    const habit = createHabit('  Lire  ', '#4dabf7', TODAY);
    expect(habit.name).toBe('Lire');
    expect(habit.color).toBe('#4dabf7');
    expect(habit.createdOn).toBe(TODAY);
    expect(habit.archived).toBe(false);
    expect(habit.id).toMatch(/^[0-9a-f-]{36}$/);
  });
  it('refuse un nom vide ou trop long', () => {
    expect(() => createHabit('   ', '#000', TODAY)).toThrow();
    expect(() => createHabit('a'.repeat(61), '#000', TODAY)).toThrow();
  });
});

describe('toggleCompletion / isCompletedOn', () => {
  it('ajoute puis retire une complétion pour le même jour', () => {
    let completions: Completion[] = [];
    completions = toggleCompletion(completions, 'h1', TODAY);
    expect(isCompletedOn(completions, 'h1', TODAY)).toBe(true);
    completions = toggleCompletion(completions, 'h1', TODAY);
    expect(isCompletedOn(completions, 'h1', TODAY)).toBe(false);
    expect(completions).toEqual([]);
  });
  it('ne mélange pas les habitudes ni les jours', () => {
    let completions: Completion[] = [];
    completions = toggleCompletion(completions, 'h1', TODAY);
    completions = toggleCompletion(completions, 'h2', TODAY);
    expect(isCompletedOn(completions, 'h1', '2026-09-16')).toBe(false);
    expect(isCompletedOn(completions, 'h2', TODAY)).toBe(true);
    expect(completions).toHaveLength(2);
  });
});

describe('lastNDays', () => {
  it('retourne les N derniers jours en ordre chronologique, le dernier étant aujourd’hui', () => {
    expect(lastNDays(TODAY, 3)).toEqual(['2026-09-15', '2026-09-16', '2026-09-17']);
  });
});

describe('currentStreak', () => {
  it('compte les jours consécutifs jusqu’à aujourd’hui inclus', () => {
    const completions: Completion[] = ['2026-09-15', '2026-09-16', '2026-09-17'].map((date) => ({ habitId: 'h1', date }));
    expect(currentStreak(completions, 'h1', TODAY)).toBe(3);
  });
  it("n'interrompt pas une série en cours quand aujourd'hui n'est pas encore fait", () => {
    const completions: Completion[] = ['2026-09-15', '2026-09-16'].map((date) => ({ habitId: 'h1', date }));
    expect(currentStreak(completions, 'h1', TODAY)).toBe(2);
  });
  it('remet la série à zéro après un jour manqué', () => {
    const completions: Completion[] = ['2026-09-10', '2026-09-16', '2026-09-17'].map((date) => ({ habitId: 'h1', date }));
    expect(currentStreak(completions, 'h1', TODAY)).toBe(2);
  });
  it('est à zéro sans aucune complétion', () => {
    expect(currentStreak([], 'h1', TODAY)).toBe(0);
  });
});

describe('completionRate', () => {
  it("calcule le pourcentage sur la fenêtre demandée, sans compter les jours futurs", () => {
    const completions: Completion[] = ['2026-09-15', '2026-09-16', '2026-09-17'].map((date) => ({ habitId: 'h1', date }));
    expect(completionRate(completions, 'h1', TODAY, 3)).toBe(100);
    expect(completionRate(completions, 'h1', TODAY, 6)).toBe(50);
    expect(completionRate([], 'h1', TODAY, 7)).toBe(0);
  });
});
