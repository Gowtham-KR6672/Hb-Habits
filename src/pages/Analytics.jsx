import React, { useMemo } from 'react';
import { useHabits } from '../context/HabitContext';
import TopAppBar from '../components/layout/TopAppBar';
import { format, subDays } from 'date-fns';

export default function Analytics() {
  const { habits, habitLogs } = useHabits();

  const stats = useMemo(() => {
    let activeHabits = habits.length;
    let totalSessions = habitLogs.filter(l => l.status === 'completed').length;
    let bestGlobalStreak = 0;

    // simplistic calculation
    habits.forEach(h => {
      let tempStreak = 0;
      let logsForH = habitLogs.filter(l => l.habitId === h.id && l.status === 'completed');

      for (let i = 0; i < 365; i++) {
        let dStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
        if (logsForH.find(l => l.date === dStr)) {
          tempStreak++;
          if (tempStreak > bestGlobalStreak) bestGlobalStreak = tempStreak;
        } else {
          tempStreak = 0;
        }
      }
    });

    const completionRate = activeHabits > 0 ? Math.min(100, Math.round((totalSessions / (activeHabits * 30)) * 100)) : 0; // Fake past 30 days expected

    return { activeHabits, totalSessions, bestGlobalStreak, completionRate };
  }, [habits, habitLogs]);

  // dummy heatmap array for UI display
  const heatmapData = Array.from({ length: 70 }).map((_, i) => {
    const val = Math.random();
    if (val > 0.8) return 'bg-secondary';
    if (val > 0.6) return 'bg-secondary/70';
    if (val > 0.4) return 'bg-secondary/40';
    if (val > 0.2) return 'bg-secondary/20';
    return 'bg-white/5';
  });

  return (
    <>
      <TopAppBar title="HB Habits" />
      <main className="mt-24 px-6 pt-8 pb-32 max-w-4xl mx-auto space-y-10">
        <section>
          <h2 className="font-headline-xl text-headline-xl text-on-surface">Analytics</h2>
          <p className="text-on-primary-container font-body-md mt-2">Visualizing your growth.</p>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="glass-card p-5 rounded-xl flex flex-col justify-between h-32">
            <span className="font-label-caps text-label-caps text-on-primary-container">COMPLETION RATE</span>
            <div className="flex items-baseline gap-1">
              <span className="font-headline-lg text-headline-lg text-secondary">{stats.completionRate || 0}</span>
              <span className="text-secondary/60 text-body-sm font-bold">%</span>
            </div>
          </div>
          <div className="glass-card p-5 rounded-xl flex flex-col justify-between h-32">
            <span className="font-label-caps text-label-caps text-on-primary-container">BEST STREAK</span>
            <div className="flex items-baseline gap-1">
              <span className="font-headline-lg text-headline-lg text-tertiary">{stats.bestGlobalStreak}</span>
              <span className="text-tertiary/60 text-body-sm font-bold">DAYS</span>
            </div>
          </div>
          <div className="glass-card p-5 rounded-xl flex flex-col justify-between h-32">
            <span className="font-label-caps text-label-caps text-on-primary-container">HABITS ACTIVE</span>
            <div className="flex items-baseline gap-1">
              <span className="font-headline-lg text-headline-lg text-on-surface">{stats.activeHabits}</span>
            </div>
          </div>
          <div className="glass-card p-5 rounded-xl flex flex-col justify-between h-32">
            <span className="font-label-caps text-label-caps text-on-primary-container">TOTAL SESSIONS</span>
            <div className="flex items-baseline gap-1">
              <span className="font-headline-lg text-headline-lg text-on-surface">{stats.totalSessions}</span>
            </div>
          </div>
        </section>

        <section className="glass-card p-6 rounded-xl overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-lg text-headline-lg text-on-surface">Intensity Map</h3>
          </div>
          <div className="overflow-x-auto pb-2 hide-scrollbar">
            <div className="grid grid-flow-col grid-rows-7 gap-1 min-w-[300px]">
              {heatmapData.map((colorClass, i) => (
                <div key={i} className={`heatmap-cell ${colorClass}`}></div>
              ))}
            </div>
          </div>
        </section>

        <section className="glass-card rounded-xl overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h3 className="font-headline-lg text-headline-lg text-on-surface">Habit Breakdown</h3>
          </div>
          <div className="divide-y divide-white/5">
            {habits.map(habit => {
              const sessions = habitLogs.filter(l => l.habitId === habit.id && l.status === 'completed').length;
              return (
                <div key={habit.id} className="p-6 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="font-bold text-on-surface">{habit.name}</span>
                    <span className="text-body-sm text-on-primary-container">{habit.category}</span>
                  </div>
                  <div className="flex gap-8">
                    <div className="text-right">
                      <span className="block text-secondary font-bold">{sessions}</span>
                      <span className="text-[10px] text-on-primary-container uppercase font-bold tracking-widest">LOGS</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {habits.length === 0 && (
              <div className="p-6 text-center text-on-surface-variant">No habits active</div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
