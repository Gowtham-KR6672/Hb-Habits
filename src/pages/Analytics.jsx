import { useState, useMemo } from 'react';
import { useHabits } from '../context/HabitContext';
import TopAppBar from '../components/layout/TopAppBar';
import ActivityRings from '../components/analytics/ActivityRings';
import { format, subDays, subMonths, isBefore, isAfter, startOfDay, parseISO } from 'date-fns';

const TIMEFRAMES = {
  Day: { days: 1, label: 'Today', previousLabel: 'Yesterday', unitLabel: 'day' },
  Week: { days: 7, label: 'Last 7 days', previousLabel: 'Previous 7 days', unitLabel: 'week' },
  Month: { days: 30, label: 'Last 30 days', previousLabel: 'Previous 30 days', unitLabel: 'month' },
  Year: { days: 365, label: 'Last 365 days', previousLabel: 'Previous 365 days', unitLabel: 'year' },
};

const getLogDate = (log) => startOfDay(parseISO(log.date));

const isWithinRange = (date, start, end) => {
  return !isBefore(date, start) && !isAfter(date, end);
};

const getCompletedCount = (logs, start, end, habitId = null) => {
  return logs.filter((log) => {
    if (log.status !== 'completed') return false;
    if (habitId && log.habitId !== habitId) return false;
    return isWithinRange(getLogDate(log), start, end);
  }).length;
};

const MetricDelta = ({ value, suffix = '' }) => {
  if (value > 0) return <span className="text-secondary text-xs font-bold bg-secondary/10 px-1.5 py-0.5 rounded ml-2">+{value}{suffix}</span>;
  if (value < 0) return <span className="text-error text-xs font-bold bg-error/10 px-1.5 py-0.5 rounded ml-2">{value}{suffix}</span>;
  return <span className="text-on-surface-variant text-xs font-bold bg-white/5 px-1.5 py-0.5 rounded ml-2">0{suffix}</span>;
};

export default function Analytics() {
  const { habits, habitLogs, selectedDate } = useHabits();
  const [timeframe, setTimeframe] = useState('Week');

  const stats = useMemo(() => {
    const today = startOfDay(selectedDate);
    const config = TIMEFRAMES[timeframe];

    const currentEnd = today;
    const currentStart = subDays(today, config.days - 1);
    const previousEnd = subDays(currentStart, 1);
    const previousStart = subDays(previousEnd, config.days - 1);

    const activeHabits = habits.length;
    const currentSessions = getCompletedCount(habitLogs, currentStart, currentEnd);
    const previousSessions = getCompletedCount(habitLogs, previousStart, previousEnd);
    const maxPossibleSessions = activeHabits * config.days;

    const currentRate = maxPossibleSessions > 0 ? Math.min(100, Math.round((currentSessions / maxPossibleSessions) * 100)) : 0;
    const previousRate = maxPossibleSessions > 0 ? Math.min(100, Math.round((previousSessions / maxPossibleSessions) * 100)) : 0;

    const makeBucket = (label, currentBucketStart, currentBucketEnd, previousBucketStart, previousBucketEnd) => ({
      label,
      current: getCompletedCount(habitLogs, currentBucketStart, currentBucketEnd),
      previous: getCompletedCount(habitLogs, previousBucketStart, previousBucketEnd),
    });

    let chartData = [];

    if (timeframe === 'Day') {
      chartData = [
        {
          label: 'Completed',
          current: currentSessions,
          previous: previousSessions,
        },
      ];
    }

    if (timeframe === 'Week') {
      chartData = Array.from({ length: 7 }).map((_, index) => {
        const currentDate = subDays(currentEnd, 6 - index);
        const previousDate = subDays(previousEnd, 6 - index);
        return makeBucket(format(currentDate, 'EEE'), currentDate, currentDate, previousDate, previousDate);
      });
    }

    if (timeframe === 'Month') {
      chartData = Array.from({ length: 5 }).map((_, index) => {
        const daysFromStart = index * 6;
        const currentBucketStart = subDays(currentStart, -daysFromStart);
        const currentBucketEnd = index === 4 ? currentEnd : subDays(currentBucketStart, -5);
        const previousBucketStart = subDays(previousStart, -daysFromStart);
        const previousBucketEnd = index === 4 ? previousEnd : subDays(previousBucketStart, -5);
        return makeBucket(`P${index + 1}`, currentBucketStart, currentBucketEnd, previousBucketStart, previousBucketEnd);
      });
    }

    if (timeframe === 'Year') {
      chartData = Array.from({ length: 12 }).map((_, index) => {
        const currentMonth = subMonths(currentEnd, 11 - index);
        const previousMonth = subMonths(currentMonth, 12);
        const currentKey = format(currentMonth, 'yyyy-MM');
        const previousKey = format(previousMonth, 'yyyy-MM');

        return {
          label: format(currentMonth, 'MMM'),
          current: habitLogs.filter((log) => log.status === 'completed' && log.date.startsWith(currentKey)).length,
          previous: habitLogs.filter((log) => log.status === 'completed' && log.date.startsWith(previousKey)).length,
        };
      });
    }

    const maxChartValue = Math.max(...chartData.flatMap((data) => [data.current, data.previous]), 1);

    const habitBreakdown = habits.map((habit) => {
      const current = getCompletedCount(habitLogs, currentStart, currentEnd, habit.id);
      const previous = getCompletedCount(habitLogs, previousStart, previousEnd, habit.id);

      return {
        ...habit,
        current,
        previous,
        delta: current - previous,
      };
    });

    return {
      activeHabits,
      currentSessions,
      previousSessions,
      currentRate,
      previousRate,
      rateDelta: currentRate - previousRate,
      sessionsDelta: currentSessions - previousSessions,
      chartData,
      maxChartValue,
      habitBreakdown,
      currentLabel: config.label,
      previousLabel: config.previousLabel,
      unitLabel: config.unitLabel,
      configDays: config.days,
    };
  }, [habits, habitLogs, timeframe]);

  const ringsData = useMemo(() => {
    // Dynamically get categories that have at least one habit assigned
    const activeCategories = Array.from(new Set(habits.map(h => h.category)));
    
    return activeCategories.map(cat => {
      const habitsInCat = stats.habitBreakdown.filter(h => h.category === cat);
      const totalSessionsPossible = habitsInCat.length * stats.configDays;
      const actualSessions = habitsInCat.reduce((sum, h) => sum + h.current, 0);
      
      const progress = totalSessionsPossible > 0 
        ? Math.min(100, Math.round((actualSessions / totalSessionsPossible) * 100)) 
        : 0;

      return { label: cat, progress };
    });
  }, [stats, habits]);

  return (
    <>
      <TopAppBar title="Analytics" />
      <main className="mt-24 px-6 pt-8 pb-32 max-w-4xl mx-auto space-y-8">
        <section className="flex bg-surface-variant/30 rounded-2xl p-1 backdrop-blur-md border border-white/5">
          {Object.keys(TIMEFRAMES).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`flex-1 py-2.5 rounded-xl font-label-caps text-[11px] uppercase tracking-wider transition-all duration-300 ${timeframe === tf ? 'bg-secondary text-on-secondary-container shadow-[0_4px_15px_rgba(78,222,163,0.3)]' : 'text-on-surface-variant hover:text-white'}`}
            >
              {tf}
            </button>
          ))}
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between min-h-32 relative overflow-hidden">
            <span className="font-label-caps text-label-caps text-on-primary-container z-10">COMPLETION RATE</span>
            <div className="flex items-baseline gap-1 z-10">
              <span className="font-headline-lg text-headline-lg text-secondary">{stats.currentRate}</span>
              <span className="text-secondary/60 text-body-sm font-bold">%</span>
            </div>
            <div className="absolute top-4 right-4 z-10">
              <MetricDelta value={stats.rateDelta} suffix="%" />
            </div>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest z-10">vs {stats.previousLabel}</span>
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-secondary/10 rounded-full blur-xl"></div>
          </div>

          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between min-h-32 relative overflow-hidden">
            <span className="font-label-caps text-label-caps text-on-primary-container z-10">TOTAL SESSIONS</span>
            <div className="flex items-baseline gap-1 z-10">
              <span className="font-headline-lg text-headline-lg text-tertiary">{stats.currentSessions}</span>
            </div>
            <div className="absolute top-4 right-4 z-10">
              <MetricDelta value={stats.sessionsDelta} />
            </div>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest z-10">{stats.currentLabel}</span>
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-tertiary/10 rounded-full blur-xl"></div>
          </div>

          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between min-h-32 relative overflow-hidden">
            <span className="font-label-caps text-label-caps text-on-primary-container z-10">PREVIOUS</span>
            <div className="flex items-baseline gap-1 z-10">
              <span className="font-headline-lg text-headline-lg text-on-surface">{stats.previousSessions}</span>
              <span className="text-on-surface-variant text-body-sm"> logs</span>
            </div>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest z-10">{stats.previousLabel}</span>
          </div>

          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between min-h-32 relative overflow-hidden">
            <span className="font-label-caps text-label-caps text-on-primary-container z-10">ACTIVE HABITS</span>
            <div className="flex items-baseline gap-1 z-10">
              <span className="font-headline-lg text-headline-lg text-on-surface">{stats.activeHabits}</span>
              <span className="text-on-surface-variant text-body-sm"> habits</span>
            </div>
          </div>
        </section>

        <ActivityRings data={ringsData} />

        <section className="glass-card p-6 rounded-3xl overflow-hidden border border-white/5 relative">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-surface/50 pointer-events-none"></div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-8 relative z-10">
            <div>
              <h3 className="font-headline-lg text-headline-lg text-on-surface">Momentum Comparison</h3>
              <p className="text-body-sm text-on-surface-variant">{stats.currentLabel} compared with {stats.previousLabel.toLowerCase()}</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-label-caps uppercase tracking-wider text-on-primary-container">
              <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-secondary"></span>Current</span>
              <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-tertiary"></span>Previous</span>
            </div>
          </div>

          <div className="h-52 flex items-end justify-between gap-2 relative z-10">
            {stats.chartData.map((data, index) => {
              const currentHeight = Math.max((data.current / stats.maxChartValue) * 100, data.current > 0 ? 4 : 2);
              const previousHeight = Math.max((data.previous / stats.maxChartValue) * 100, data.previous > 0 ? 4 : 2);

              return (
                <div key={`${data.label}-${index}`} className="flex flex-col items-center flex-1 gap-3 group min-w-0">
                  <div className="w-full relative flex justify-center items-end gap-1 h-36">
                    <div className="absolute -top-10 bg-surface-variant text-on-surface text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg z-20">
                      {data.current} vs {data.previous} logs
                    </div>
                    <div
                      className="w-full max-w-[18px] bg-secondary/85 rounded-t-md transition-all duration-500 ease-out group-hover:bg-secondary shadow-[0_0_15px_rgba(78,222,163,0.12)]"
                      style={{ height: `${currentHeight}%` }}
                    ></div>
                    <div
                      className="w-full max-w-[18px] bg-tertiary/70 rounded-t-md transition-all duration-500 ease-out group-hover:bg-tertiary shadow-[0_0_15px_rgba(255,185,95,0.12)]"
                      style={{ height: `${previousHeight}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-label-caps uppercase tracking-wider text-on-surface-variant group-hover:text-white transition-colors truncate max-w-full">{data.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="glass-card rounded-3xl overflow-hidden border border-white/5">
          <div className="p-6 border-b border-white/5 bg-white/[0.02] flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <h3 className="font-headline-lg text-headline-lg text-on-surface">Habit Breakdown</h3>
            <span className="text-xs font-label-caps uppercase text-on-primary-container tracking-widest">{timeframe} wise</span>
          </div>
          <div className="divide-y divide-white/5">
            {stats.habitBreakdown.map((habit) => (
              <div key={habit.id} className="p-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center hover:bg-white/[0.02] transition-colors">
                <div className="flex flex-col">
                  <span className="font-bold text-on-surface text-lg">{habit.name}</span>
                  <span className="text-body-sm text-on-primary-container">{habit.category}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:w-[280px]">
                  <div className="bg-surface-variant/50 px-3 py-2 rounded-xl border border-white/5 text-center">
                    <span className="block text-secondary font-headline-lg">{habit.current}</span>
                    <span className="text-[9px] text-on-primary-container uppercase font-bold tracking-widest">Current</span>
                  </div>
                  <div className="bg-surface-variant/50 px-3 py-2 rounded-xl border border-white/5 text-center">
                    <span className="block text-tertiary font-headline-lg">{habit.previous}</span>
                    <span className="text-[9px] text-on-primary-container uppercase font-bold tracking-widest">Previous</span>
                  </div>
                  <div className="bg-surface-variant/50 px-3 py-2 rounded-xl border border-white/5 text-center">
                    <span className={`block font-headline-lg ${habit.delta >= 0 ? 'text-secondary' : 'text-error'}`}>{habit.delta > 0 ? `+${habit.delta}` : habit.delta}</span>
                    <span className="text-[9px] text-on-primary-container uppercase font-bold tracking-widest">Change</span>
                  </div>
                </div>
              </div>
            ))}
            {habits.length === 0 && (
              <div className="p-10 text-center text-on-surface-variant flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-4xl opacity-50">analytics</span>
                <p>No habits active yet. Start tracking to see analytics!</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
