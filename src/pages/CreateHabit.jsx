import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHabits } from '../context/HabitContext';

export default function CreateHabit() {
  const navigate = useNavigate();
  const { addHabit } = useHabits();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Fitness');
  const [type, setType] = useState('Binary');
  const [frequency, setFrequency] = useState('Daily');
  const [targetValue, setTargetValue] = useState(1);
  const [reminder, setReminder] = useState('08:00');
  const [description, setDescription] = useState('');
  const [timezone, setTimezone] = useState('');

  const categories = [
    { name: 'Health', icon: 'health_and_safety' },
    { name: 'Fitness', icon: 'fitness_center' },
    { name: 'Study', icon: 'school' },
    { name: 'Outdoor', icon: 'directions_run' },
    { name: 'Indoor', icon: 'home' }
  ];

  const types = ['Binary', 'Quantity', 'Timer', 'Distance'];

  const handleSave = () => {
    if (!name.trim()) return;
    addHabit({
      name,
      category,
      type,
      frequency,
      targetValue,
      reminder,
      description,
      timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md selection:bg-secondary/30 pb-32">
      <header className="bg-slate-900/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 py-4 w-full fixed top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-slate-50">arrow_back</span>
          </button>
          <h1 className="text-xl font-extrabold text-slate-50 font-headline-lg tracking-tight">Create Habit</h1>
        </div>
      </header>

      <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto space-y-10">
        <section className="space-y-6">
          <div className="space-y-2">
            <label className="font-label-caps text-label-caps text-on-primary-container ml-1 uppercase">Habit Identity</label>
            <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
              <input 
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-headline-lg font-headline-lg placeholder:text-on-surface-variant/40 p-0" 
                placeholder="Name your habit..." 
                type="text"
                autoFocus
              />
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-body-md text-on-surface-variant p-0 resize-none h-10 placeholder:text-on-surface-variant/40"
                placeholder="Optional description or motivation..."
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="font-label-caps text-label-caps text-on-primary-container ml-1 uppercase">Select Category</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map(cat => (
                <button 
                  key={cat.name}
                  onClick={() => setCategory(cat.name)}
                  className={`rounded-xl p-4 flex flex-col items-center justify-center gap-2 border transition-all active:scale-95 duration-150 ${category === cat.name ? 'border-white/10 bg-white/10 active-ring' : 'glass-card border-white/5 hover:bg-white/10'}`}
                >
                  <span className="material-symbols-outlined text-emerald-400">{cat.icon}</span>
                  <span className={`font-label-caps text-[10px] text-on-surface uppercase ${category === cat.name ? 'font-bold' : ''}`}>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-3">
            <label className="font-label-caps text-label-caps text-on-primary-container ml-1 uppercase">Measurement Type</label>
            <div className="glass-card rounded-2xl p-2 border border-white/5 grid grid-cols-2 md:grid-cols-4 gap-1">
              {types.map(t => (
                <button 
                  key={t}
                  onClick={() => setType(t)}
                  className={`py-3 rounded-xl font-label-caps text-[10px] uppercase tracking-widest transition-colors ${type === t ? 'bg-white/10 text-on-surface active-ring' : 'text-on-surface-variant hover:bg-white/5'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="font-label-caps text-label-caps text-on-primary-container ml-1 uppercase">Frequency</label>
              <div className="glass-card rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                <span className="text-on-surface font-body-md">{frequency}</span>
                <span className="material-symbols-outlined text-secondary">expand_more</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="font-label-caps text-label-caps text-on-primary-container ml-1 uppercase">Goal Value</label>
              <div className="glass-card rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                <input 
                  type="number" 
                  value={targetValue} 
                  onChange={e => setTargetValue(Number(e.target.value))} 
                  className="bg-transparent border-none focus:ring-0 text-on-surface font-body-md w-16 p-0 text-center" 
                />
                <span className="text-on-primary-container text-xs font-label-caps">{type === 'Timer' ? 'MINS' : type === 'Distance' ? 'KM' : 'TIMES'}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="glass-card rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-tertiary">notifications_active</span>
                </div>
                <div>
                  <p className="text-on-surface font-semibold">Reminder</p>
                  <p className="text-on-primary-container text-sm">Get notified to stay on track</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="time" 
                  value={reminder} 
                  onChange={e => setReminder(e.target.value)}
                  className="bg-transparent text-emerald-400 font-bold font-headline-lg border-none focus:ring-0 p-0"
                />
              </div>
            </div>
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-on-surface text-sm">Timezone Override</span>
              <input 
                type="text" 
                value={timezone} 
                onChange={e => setTimezone(e.target.value)}
                placeholder="Default (Auto)"
                className="bg-transparent border-none focus:ring-0 text-on-surface-variant text-sm text-right p-0 w-32"
              />
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 w-full z-50 px-6 pb-24 md:pb-10 pt-4 bg-gradient-to-t from-background via-background/90 to-transparent">
        <button onClick={handleSave} disabled={!name.trim()} className="w-full bg-secondary text-on-secondary-container font-headline-lg text-lg py-5 rounded-2xl shadow-[0_10px_40px_rgba(78,222,163,0.25)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100">
          <span className="material-symbols-outlined">check_circle</span>
          Save Habit
        </button>
      </div>
    </div>
  );
}
