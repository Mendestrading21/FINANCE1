export interface Habit {
  id: string;
  name: string;
  color: string;
  createdOn: string;
  archived: boolean;
}

export interface Completion {
  habitId: string;
  date: string;
}

export const PALETTE = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#da77f2'] as const;

export function createHabit(name: string, color: string, today: string): Habit {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Le nom est obligatoire.');
  if (trimmed.length > 60) throw new Error('60 caractères maximum.');
  return { id: crypto.randomUUID(), name: trimmed, color, createdOn: today, archived: false };
}

export function toggleCompletion(completions: Completion[], habitId: string, date: string): Completion[] {
  const exists = completions.some((c) => c.habitId === habitId && c.date === date);
  return exists
    ? completions.filter((c) => !(c.habitId === habitId && c.date === date))
    : [...completions, { habitId, date }];
}

export function isCompletedOn(completions: Completion[], habitId: string, date: string): boolean {
  return completions.some((c) => c.habitId === habitId && c.date === date);
}

function addDays(date: string, delta: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function lastNDays(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, -(n - 1 - i)));
}

/** Days completed in a row up to today; a day not yet checked off doesn't break a streak until it's over (falls back to yesterday). */
export function currentStreak(completions: Completion[], habitId: string, today: string): number {
  let cursor = isCompletedOn(completions, habitId, today) ? today : addDays(today, -1);
  let streak = 0;
  while (isCompletedOn(completions, habitId, cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function completionRate(completions: Completion[], habitId: string, today: string, days: number): number {
  const window = lastNDays(today, days).filter((d) => d <= today);
  if (!window.length) return 0;
  const done = window.filter((d) => isCompletedOn(completions, habitId, d)).length;
  return Math.round((done / window.length) * 100);
}
