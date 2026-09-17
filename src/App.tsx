import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  PALETTE,
  completionRate,
  createHabit,
  currentStreak,
  isCompletedOn,
  lastNDays,
  toggleCompletion,
  type Completion,
  type Habit,
} from './domain/habits';
import { loadState, saveState } from './storage';

function todayLocal(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function dayLabel(date: string): string {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return DAY_LABELS[(weekday + 6) % 7];
}

export default function App() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(PALETTE[0]);
  const [error, setError] = useState('');
  const today = useMemo(() => todayLocal(), []);
  const week = useMemo(() => lastNDays(today, 7), [today]);

  useEffect(() => {
    const state = loadState();
    setHabits(state.habits);
    setCompletions(state.completions);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveState({ version: 1, habits, completions });
  }, [loaded, habits, completions]);

  function addHabit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const habit = createHabit(name, color, today);
      setHabits((prev) => [...prev, habit]);
      setName('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Nom invalide.');
    }
  }

  function toggle(habitId: string, date: string) {
    setCompletions((prev) => toggleCompletion(prev, habitId, date));
  }

  function archive(habitId: string) {
    setHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, archived: true } : h)));
  }

  const active = habits.filter((h) => !h.archived);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Habitudes</h1>
        <p className="app-subtitle">Suivi privé, sur cet appareil uniquement.</p>
      </header>

      <form className="add-form" onSubmit={addHabit}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nouvelle habitude (ex. Lire, Sport, Méditer)"
          maxLength={60}
          aria-label="Nom de la nouvelle habitude"
        />
        <div className="palette" role="radiogroup" aria-label="Couleur">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              className="swatch"
              role="radio"
              aria-checked={color === c}
              aria-label={`Couleur ${c}`}
              style={{ background: c, outline: color === c ? '2px solid #fff' : 'none' }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <button type="submit" className="button primary">
          Ajouter
        </button>
      </form>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {active.length === 0 ? (
        <div className="empty">
          <p>Aucune habitude pour l’instant.</p>
          <p className="muted">Ajoute-en une ci-dessus pour commencer à suivre ta série.</p>
        </div>
      ) : (
        <ul className="habit-list">
          {active.map((habit) => {
            const streak = currentStreak(completions, habit.id, today);
            const rate = completionRate(completions, habit.id, today, 30);
            return (
              <li key={habit.id} className="habit-card" style={{ borderLeftColor: habit.color }}>
                <div className="habit-top">
                  <span className="habit-name">{habit.name}</span>
                  <span className="habit-streak" aria-label={`Série de ${streak} jour(s)`}>
                    {streak > 0 ? `🔥 ${streak}` : '—'}
                  </span>
                </div>
                <div className="week-row">
                  {week.map((date) => {
                    const done = isCompletedOn(completions, habit.id, date);
                    const isFuture = date > today;
                    return (
                      <button
                        key={date}
                        type="button"
                        disabled={isFuture}
                        className={`day-dot${done ? ' done' : ''}${date === today ? ' today' : ''}`}
                        style={done ? { background: habit.color, borderColor: habit.color } : undefined}
                        aria-label={`${habit.name} — ${date}${done ? ', fait' : ', pas fait'}`}
                        aria-pressed={done}
                        onClick={() => toggle(habit.id, date)}
                      >
                        {dayLabel(date)}
                      </button>
                    );
                  })}
                </div>
                <div className="habit-bottom">
                  <span className="muted">{rate}% sur 30 jours</span>
                  <button type="button" className="text-button" onClick={() => archive(habit.id)}>
                    Archiver
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
