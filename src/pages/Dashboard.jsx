import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHabits } from '../context/HabitContext';
import TopAppBar from '../components/layout/TopAppBar';
import { format, addDays, subDays, isAfter, startOfDay } from 'date-fns';

export default function Dashboard() {
  const { habits, habitLogs, logHabit, getLog, selectedDate, setSelectedDate } = useHabits();
  const navigate = useNavigate();
  const todayStr = format(selectedDate, 'yyyy-MM-dd');

  // Basic streak calculation logic could go here, for now using dummy or computed zero
  const habitsWithStatus = useMemo(() => {
    return habits.map(h => {
      // Calculate a simple streak based on habitLogs
      const hLogs = habitLogs.filter(l => l.habitId === h.id && l.status === 'completed').sort((a,b) => new Date(b.date) - new Date(a.date));
      let currentStreak = 0;
      let checkDate = new Date();
      // simplified streak check for MVP
      for (let i = 0; i < 365; i++) {
         let dStr = format(checkDate, 'yyyy-MM-dd');
         let isLogged = hLogs.find(l => l.date === dStr);
         if (isLogged) currentStreak++;
         else if (i > 0) break; // skip today if not completed, but break if yesterday not completed
         checkDate.setDate(checkDate.getDate() - 1);
      }

      return {
        ...h,
        streak: currentStreak,
        todayLog: getLog(h.id, todayStr)
      };
    });
  }, [habits, habitLogs, getLog, todayStr]);

  const completedCount = habitsWithStatus.filter(h => h.todayLog?.status === 'completed').length;
  const totalCount = habits.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const toggleHabit = (habit) => {
    const log = habit.todayLog;
    if (habit.type === 'Quantity') {
      const currentVal = log?.value || 0;
      let newVal = currentVal + 1;
      if (currentVal >= habit.targetValue) {
        newVal = 0; // reset if clicking when already completed
      }
      const newStatus = newVal >= habit.targetValue ? 'completed' : (newVal > 0 ? 'partial' : 'incomplete');
      logHabit(habit.id, todayStr, newStatus, newVal);
    } else {
      const newStatus = log?.status === 'completed' ? 'incomplete' : 'completed';
      logHabit(habit.id, todayStr, newStatus, log?.status === 'completed' ? 0 : habit.targetValue);
    }
  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const nextDate = () => {
    if (!isToday) setSelectedDate(prev => addDays(prev, 1));
  };
  const prevDate = () => setSelectedDate(prev => subDays(prev, 1));

  return (
    <>
      <TopAppBar title="HB Habits" />
      <main className="mt-24 px-6 max-w-2xl mx-auto pb-32">
        <section className="mb-10">
          <h1 className="text-3xl md:text-5xl font-black text-on-surface mb-6 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
            Keep the momentum!
          </h1>
          
          <div className="rounded-[32px] p-8 border border-on-surface/10 relative overflow-hidden shadow-2xl bg-surface-container-high/60 backdrop-blur-3xl min-h-[160px] flex items-center">
            {/* Full Card Water Fill */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[32px]">
              <div 
                className="water-wave" 
                style={{ top: `${Math.max(8, 100 - progressPercent)}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between w-full relative z-10">
              <div className="flex-1">
                <p className="font-black text-[12px] uppercase tracking-[0.25em] text-black mb-3">DAILY PROGRESS</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-black text-black">{completedCount}</span>
                  <span className="text-2xl font-black text-black/40">/ {totalCount}</span>
                </div>
                <p className="text-sm font-black text-black mt-2">habits completed today</p>
              </div>
              
              <div className="flex flex-col items-end">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-black leading-none">{progressPercent}</span>
                  <span className="text-sm font-black text-black uppercase tracking-widest">%</span>
                </div>
                <p className="text-[10px] font-black text-black uppercase tracking-widest mt-2">Completed</p>
              </div>
            </div>
          </div>

          {/* Date Switcher */}
          <div className="mt-8 flex items-center justify-center gap-6 py-2">
            <button 
              onClick={prevDate}
              className="p-2 text-on-surface hover:text-secondary transition-colors active:scale-90"
            >
              <span className="material-symbols-outlined text-4xl font-bold">chevron_left</span>
            </button>
            
            <div 
              className="flex flex-col items-center cursor-pointer group"
              onClick={() => document.getElementById('date-picker').showPicker()}
            >
              <input 
                id="date-picker"
                type="date" 
                className="sr-only" 
                max={format(new Date(), 'yyyy-MM-dd')}
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  if (!isAfter(newDate, startOfDay(new Date()))) {
                    setSelectedDate(newDate);
                  }
                }}
              />
              <span className="text-2xl font-black text-on-surface tracking-widest font-mono group-hover:text-secondary transition-colors">
                {format(selectedDate, 'dd-MM-yyyy')}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em] group-hover:text-secondary transition-colors">
                  {format(selectedDate, 'EEEE')}
                </span>
              </div>
            </div>

            <button 
              onClick={nextDate}
              disabled={isToday}
              className={`p-2 transition-colors active:scale-90 ${isToday ? 'text-on-surface/20 cursor-not-allowed' : 'text-on-surface hover:text-secondary'}`}
            >
              <span className="material-symbols-outlined text-4xl font-bold">chevron_right</span>
            </button>
          </div>
        </section>

        <div className="space-y-6">
          {habitsWithStatus.length === 0 ? (
            <div className="text-center py-20 rounded-[40px] border border-on-surface/10 bg-surface-container-low/40 backdrop-blur-md">
              <div className="w-24 h-24 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <span className="material-symbols-outlined text-5xl text-secondary/40">add_task</span>
              </div>
              <p className="text-on-surface font-bold text-lg mb-2">Ready to start?</p>
              <p className="text-on-surface-variant text-sm mb-6">Create your first habit to begin tracking.</p>
              <button onClick={() => navigate('/new')} className="px-8 py-3 rounded-full bg-secondary text-on-secondary font-black uppercase tracking-widest text-xs shadow-lg shadow-secondary/20 hover:scale-105 transition-transform">
                Create Habit
              </button>
            </div>
          ) : (
            habitsWithStatus.map(habit => {
              const isCompleted = habit.todayLog?.status === 'completed';
              const isPartial = habit.todayLog?.status === 'partial';
              const currentVal = habit.todayLog?.value || 0;
              const isQuantity = habit.type === 'Quantity';

              return (
                <div 
                  key={habit.id} 
                  className={`rounded-[32px] p-7 border flex items-center justify-between transition-all duration-300 hover:-translate-y-1 group shadow-xl relative overflow-hidden cursor-pointer ${
                    isCompleted 
                      ? 'bg-secondary/[0.08] border-secondary/30 ring-1 ring-secondary/20' 
                      : 'bg-surface-container-low border-on-surface/5 hover:border-secondary/20'
                  }`}
                  onClick={() => navigate(`/habit/${habit.id}`)}
                >
                  <div className="flex-1 min-w-0 pr-6 relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-on-surface/5 border border-on-surface/5 shadow-sm">
                        <span className="material-symbols-outlined text-[16px] text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                        <span className="text-[10px] font-black text-on-surface uppercase tracking-wider">{habit.streak} Day Streak</span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-on-surface truncate leading-tight mb-1.5 group-hover:text-secondary transition-colors">{habit.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{habit.category}</span>
                      <span className="w-1 h-1 rounded-full bg-on-surface/20"></span>
                      <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{habit.type}</span>
                    </div>
                  </div>

                  <div className="relative flex items-center justify-center z-10">
                    {habit.type !== 'Distance' ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleHabit(habit); }} 
                        className={`w-16 h-16 rounded-[26px] border-2 flex flex-col items-center justify-center transition-all duration-500 shadow-2xl relative ${
                          isCompleted 
                            ? 'border-secondary bg-secondary text-on-secondary shadow-secondary/40 scale-110' 
                            : isPartial 
                              ? 'border-secondary/40 bg-secondary/10 text-secondary' 
                              : 'border-on-surface/10 bg-on-surface/5 text-on-surface-variant group-hover:border-secondary/40'
                        }`}
                      >
                        {isQuantity && !isCompleted ? (
                          <>
                            <span className="text-xl font-black leading-none">{currentVal}</span>
                            <span className="text-[10px] font-black opacity-60 uppercase tracking-tighter mt-1">/ {habit.targetValue}</span>
                          </>
                        ) : (
                          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: isCompleted ? "'FILL' 1" : "'FILL' 0" }}>
                            {isCompleted ? 'task_alt' : 'add'}
                          </span>
                        )}
                      </button>
                    ) : (
                      <div className={`w-16 h-16 rounded-[26px] border-2 flex items-center justify-center transition-all duration-500 shadow-2xl relative ${
                        isCompleted 
                          ? 'border-secondary bg-secondary text-on-secondary shadow-secondary/40 scale-110' 
                          : 'border-on-surface/10 bg-on-surface/5 text-on-surface-variant'
                      }`}>
                        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: isCompleted ? "'FILL' 1" : "'FILL' 0" }}>
                          {isCompleted ? 'verified' : 'explore'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress Line */}
                  {isPartial && !isCompleted && (
                    <div className="absolute bottom-0 left-0 h-1.5 bg-on-surface/5 w-full">
                      <div 
                        className="h-full bg-gradient-to-r from-secondary/50 to-secondary transition-all duration-700 rounded-r-full shadow-[0_0_10px_rgba(var(--color-secondary), 0.3)]" 
                        style={{ width: `${(currentVal / habit.targetValue) * 100}%` }}
                      ></div>
                    </div>
                  )}
                  {isCompleted && (
                    <div className="absolute bottom-0 left-0 h-1.5 bg-secondary w-full shadow-[0_-2px_10px_rgba(var(--color-secondary), 0.2)]"></div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      <button onClick={() => navigate('/new')} className="fixed bottom-28 right-6 w-14 h-14 bg-secondary text-on-secondary rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(78,222,163,0.3)] hover:scale-105 transition-transform z-50 hidden md:flex lg:flex xl:flex">
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>
    </>
  );
}
