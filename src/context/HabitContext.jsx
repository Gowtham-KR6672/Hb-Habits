import React, { createContext, useContext, useState, useEffect } from 'react';

const HabitContext = createContext();

export function HabitProvider({ children }) {
  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem('habits');
    return saved ? JSON.parse(saved) : [];
  });

  const [habitLogs, setHabitsLogs] = useState(() => {
    const saved = localStorage.getItem('habitLogs');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem('habitLogs', JSON.stringify(habitLogs));
  }, [habitLogs]);

  const addHabit = (habit) => {
    setHabits(prev => [...prev, { ...habit, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]);
  };

  const updateHabit = (id, updates) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  const deleteHabit = (id) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setHabitsLogs(prev => prev.filter(l => l.habitId !== id)); // Cascading delete
  };

  const logHabit = (habitId, dateStr, status, value = null) => {
    // dateStr in YYYY-MM-DD
    setHabitsLogs(prev => {
      const existingIdx = prev.findIndex(l => l.habitId === habitId && l.date === dateStr);
      if (existingIdx >= 0) {
        const newLogs = [...prev];
        newLogs[existingIdx] = { ...newLogs[existingIdx], status, value };
        return newLogs;
      }
      return [...prev, { habitId, date: dateStr, status, value }];
    });
  };

  const getLog = (habitId, dateStr) => {
    return habitLogs.find(l => l.habitId === habitId && l.date === dateStr);
  };

  return (
    <HabitContext.Provider value={{ habits, habitLogs, addHabit, updateHabit, deleteHabit, logHabit, getLog }}>
      {children}
    </HabitContext.Provider>
  );
}

export function useHabits() {
  return useContext(HabitContext);
}
