import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHabits } from '../context/HabitContext';
import TopAppBar from '../components/layout/TopAppBar';
import { format } from 'date-fns';

export default function Dashboard() {
  const { habits, habitLogs, logHabit, getLog } = useHabits();
  const navigate = useNavigate();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

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

  return (
    <>
      <TopAppBar title="HB Habits" />
      <main className="mt-24 px-6 max-w-2xl mx-auto pb-32">
        <section className="mb-10">
          <h1 className="font-headline-xl text-headline-xl text-on-surface mb-2">Keep the momentum!</h1>
          <div className="flex items-center justify-between glass-card rounded-xl p-5 border border-white/5">
            <div>
              <p className="font-label-caps text-label-caps text-on-primary-container mb-1">DAILY PROGRESS</p>
              <p className="font-headline-lg text-headline-lg text-secondary">
                {completedCount}/{totalCount} <span className="text-on-surface-variant font-body-md">completed</span>
              </p>
            </div>
            <div className="relative w-16 h-16">
              <svg className="w-full h-full transform -rotate-90">
                <circle className="text-surface-container-highest" cx="32" cy="32" fill="transparent" r={radius} stroke="currentColor" strokeWidth="3"></circle>
                <circle 
                  className="text-secondary transition-all duration-500 ease-in-out" 
                  cx="32" cy="32" fill="transparent" r={radius} stroke="currentColor" 
                  strokeDasharray={circumference} 
                  strokeDashoffset={strokeDashoffset} 
                  strokeWidth="3">
                </circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-label-caps text-label-caps text-secondary">{progressPercent}%</span>
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-element-gap">
          {habitsWithStatus.length === 0 ? (
            <p className="text-center text-on-surface-variant mt-10">No habits yet. Click + to create one.</p>
          ) : (
            habitsWithStatus.map(habit => {
              const isCompleted = habit.todayLog?.status === 'completed';
              const isPartial = habit.todayLog?.status === 'partial';
              const currentVal = habit.todayLog?.value || 0;
              const isQuantity = habit.type === 'Quantity';

              return (
                <div key={habit.id} className={`glass-card rounded-xl p-5 border border-white/5 flex items-center justify-between relative overflow-hidden cursor-pointer ${isCompleted ? 'active-ring' : ''}`} onClick={() => navigate(`/habit/${habit.id}`)}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-tertiary/10 text-tertiary px-2 py-0.5 rounded-full font-label-caps text-[10px] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span> {habit.streak} DAY STREAK
                      </span>
                    </div>
                    <h3 className="font-headline-lg text-body-md font-bold text-on-surface">{habit.name}</h3>
                    <p className="font-body-sm text-on-surface-variant">{habit.category} • {habit.type}</p>
                  </div>
                  {habit.type !== 'Distance' ? (
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleHabit(habit); }} 
                      className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors z-10 relative ${isCompleted ? 'border-secondary bg-secondary/20 text-secondary' : isPartial ? 'border-secondary/50 bg-secondary/10 text-secondary' : 'border-white/10 text-on-surface-variant hover:border-secondary/50'}`}>
                      
                      {isQuantity && !isCompleted ? (
                        <span className="font-label-caps text-xs font-bold tracking-widest">{currentVal}/{habit.targetValue}</span>
                      ) : (
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: isCompleted ? "'FILL' 1" : "'FILL' 0" }}>
                          {isCompleted ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                      )}

                    </button>
                  ) : (
                    isCompleted && (
                      <div className="w-12 h-12 rounded-full border-2 border-secondary bg-secondary/20 text-secondary flex items-center justify-center z-10 relative">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      </div>
                    )
                  )}
                  {isCompleted && <div className="absolute bottom-0 left-0 h-[2px] bg-secondary w-full transition-all duration-300"></div>}
                  {isPartial && <div className="absolute bottom-0 left-0 h-[2px] bg-secondary transition-all duration-300" style={{ width: `${(currentVal / habit.targetValue) * 100}%` }}></div>}
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
