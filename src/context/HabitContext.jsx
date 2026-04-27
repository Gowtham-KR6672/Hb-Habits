import { createContext, useContext, useState, useEffect } from 'react';

const HabitContext = createContext();

export function HabitProvider({ children }) {
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitsLogs] = useState([]);

  useEffect(() => {
    const fetchHabits = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch('/api/habits', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setHabits(data.habits);
          setHabitsLogs(data.habitLogs);
        }
      } catch (err) {
        console.error('Failed to fetch habits', err);
      }
    };
    fetchHabits();
  }, []);

  const addHabit = async (habit) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(habit)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create habit');
      }

      setHabits(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const updateHabit = async (id, updates) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/habits/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(updates)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update habit');
      }

      setHabits(prev => prev.map(h => h.id === id ? data : h));
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const deleteHabit = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/habits/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete habit');
      }

      setHabits(prev => prev.filter(h => h.id !== id));
      setHabitsLogs(prev => prev.filter(l => l.habitId !== id));
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const logHabit = async (habitId, dateStr, status, value = null) => {
    const token = localStorage.getItem('token');
    
    // Optimistic UI Update
    setHabitsLogs(prev => {
      const existingIdx = prev.findIndex(l => l.habitId === habitId && l.date === dateStr);
      if (existingIdx >= 0) {
        const newLogs = [...prev];
        newLogs[existingIdx] = { ...newLogs[existingIdx], status, value };
        return newLogs;
      }
      return [...prev, { habitId, date: dateStr, status, value, id: 'temp-id' }];
    });

    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ habitId, date: dateStr, status, value })
      });
      if (res.ok) {
        const newLog = await res.json();
        setHabitsLogs(prev => {
          const existingIdx = prev.findIndex(l => l.habitId === habitId && l.date === dateStr);
          if (existingIdx >= 0) {
            const newLogs = [...prev];
            newLogs[existingIdx] = newLog;
            return newLogs;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error(err);
    }
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
