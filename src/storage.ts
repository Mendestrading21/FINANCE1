import type { Completion, Habit } from './domain/habits';

const STORAGE_KEY = 'habitudes.v1';

export interface StoredState {
  version: 1;
  habits: Habit[];
  completions: Completion[];
}

export function emptyState(): StoredState {
  return { version: 1, habits: [], completions: [] };
}

export function loadState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 1 && Array.isArray(parsed.habits) && Array.isArray(parsed.completions))
      return parsed as StoredState;
  } catch {
    // Corrupted storage: start fresh rather than crash the app.
  }
  return emptyState();
}

export function saveState(state: StoredState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable (private browsing): data stays in memory for this session.
  }
}
