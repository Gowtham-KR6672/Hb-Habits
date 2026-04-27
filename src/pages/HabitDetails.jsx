import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHabits } from '../context/HabitContext';
import { format, subDays, startOfWeek, addDays, isSameDay } from 'date-fns';

export default function HabitDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { habits, habitLogs } = useHabits();

  const habit = habits.find(h => h.id === id);

  const logsForHabit = useMemo(() => {
    return habitLogs.filter(l => l.habitId === id);
  }, [habitLogs, id]);

  const { currentStreak, bestStreak } = useMemo(() => {
    const sortedLogs = [...logsForHabit].filter(l => l.status === 'completed').sort((a,b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    let maxStreak = 0;
    let currentTempStreak = 0;
    
    // Simplistic streak calc
    if (sortedLogs.length > 0) {
      let checkDate = new Date();
      for (let i = 0; i < 365; i++) {
        let dStr = format(checkDate, 'yyyy-MM-dd');
        let isLogged = sortedLogs.find(l => l.date === dStr);
        if (isLogged) streak++;
        else if (i > 0) break;
        checkDate.setDate(checkDate.getDate() - 1);
      }
      
      // Calculate best streak (naive)
      let tempStreak = 0;
      for (let i = 0; i < 365; i++) {
        let checkDate2 = subDays(new Date(), i);
        let dStr = format(checkDate2, 'yyyy-MM-dd');
        let isLogged = sortedLogs.find(l => l.date === dStr);
        if (isLogged) {
          tempStreak++;
          if (tempStreak > maxStreak) maxStreak = tempStreak;
        } else {
          tempStreak = 0;
        }
      }
    }
    return { currentStreak: streak, bestStreak: maxStreak };
  }, [logsForHabit]);

  if (!habit) return <div className="text-center mt-20">Habit not found</div>;

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday start
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const progressPercent = Math.min((currentStreak / habit.targetValue) * 100 || 50, 100);
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen selection:bg-secondary/30 pb-32">
      <header className="bg-slate-900/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 py-4 w-full fixed top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors active:scale-95">
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </button>
          <h1 className="text-xl font-extrabold text-slate-50 font-manrope antialiased tracking-tight">{habit.name}</h1>
        </div>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-10">
        <section className="relative flex flex-col items-center">
          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle className="text-white/5" cx="128" cy="128" fill="transparent" r={radius} stroke="currentColor" strokeWidth="4"></circle>
              <circle className="text-secondary transition-all duration-1000" cx="128" cy="128" fill="transparent" r={radius} stroke="currentColor" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeWidth="4"></circle>
            </svg>
            <div className="flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-5xl text-secondary mb-2">self_improvement</span>
              <span className="font-headline-xl text-headline-xl">{habit.targetValue}</span>
              <span className="font-label-caps text-label-caps text-on-surface-variant">Target</span>
            </div>
          </div>
          <div className="mt-8 flex gap-4 w-full">
            <div className="flex-1 glass-card p-4 rounded-xl border border-white/5 text-center">
              <span className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Current Streak</span>
              <div className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                <span className="font-headline-lg text-headline-lg text-tertiary">{currentStreak}</span>
              </div>
            </div>
            <div className="flex-1 glass-card p-4 rounded-xl border border-white/5 text-center">
              <span className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Best Streak</span>
              <div className="flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-primary">stars</span>
                <span className="font-headline-lg text-headline-lg text-primary">{bestStreak}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-lg text-headline-lg text-on-surface">Timeline</h3>
            <button className="text-secondary font-label-caps text-label-caps hover:opacity-80 transition-opacity">Weekly View</button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
            {weekDays.map(date => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const isToday = isSameDay(date, today);
              const log = logsForHabit.find(l => l.date === dateStr);
              const isCompleted = log?.status === 'completed';

              return (
                <div key={dateStr} className={`flex-shrink-0 w-16 glass-card p-3 rounded-xl border flex flex-col items-center gap-2 ${isCompleted ? 'border-secondary/20 bg-secondary/10 inner-glow' : 'border-white/5 opacity-40'}`}>
                  <span className={`font-label-caps text-label-caps ${isCompleted ? 'text-secondary' : 'text-on-surface-variant'}`}>{format(date, 'EEE')}</span>
                  <span className={`font-body-md text-body-md ${isCompleted ? 'text-white' : ''}`}>{format(date, 'dd')}</span>
                  {isCompleted ? (
                    <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-white/10"></span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-headline-lg text-headline-lg text-on-surface">Insight</h3>
          <div className="glass-card p-6 rounded-2xl border border-white/5 flex gap-4 bg-gradient-to-br from-surface-container-high/40 to-transparent">
            <div className="p-3 rounded-xl bg-tertiary/10 h-fit">
              <span className="material-symbols-outlined text-tertiary">lightbulb</span>
            </div>
            <div className="space-y-2 flex-1">
              <p className="text-body-md text-on-surface leading-relaxed">
                You're building great momentum! Keep hitting your targets to improve your weekly completion rate.
              </p>
              
              {habit.type === 'Distance' && (
                <button 
                  onClick={() => navigate(`/track/${habit.id}`)}
                  className="mt-4 w-full bg-secondary text-on-secondary-container font-headline-lg py-4 rounded-xl shadow-[0_5px_20px_rgba(78,222,163,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">explore</span>
                  Start GPS Tracking
                </button>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
