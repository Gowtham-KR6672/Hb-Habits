import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHabits } from '../context/HabitContext';

const habitTemplates = {
  Health: [
    { name: 'Drink Water', icon: 'water_drop', type: 'Quantity', targetValue: 8, unit: 'TIMES', description: 'Stay hydrated through the day.' },
    { name: 'Take Medicine', icon: 'medication', type: 'Binary', targetValue: 1, unit: 'TIMES', description: 'Keep your daily health routine steady.' },
    { name: 'Eat Fruit', icon: 'nutrition', type: 'Binary', targetValue: 1, unit: 'TIMES', description: 'Get your daily dose of vitamins.' },
    { name: 'Limit Coffee', icon: 'coffee', type: 'Quantity', targetValue: 2, unit: 'TIMES', description: 'Monitor your caffeine intake.' },
    { name: 'Skincare', icon: 'face', type: 'Binary', targetValue: 1, unit: 'TIMES', description: 'Maintain your morning/night routine.' },
    { name: 'Sleep 8 Hours', icon: 'bedtime', type: 'Binary', targetValue: 1, unit: 'TIMES', description: 'Prioritize restorative sleep.' },
    { name: 'Other', icon: 'add_circle', type: 'Binary', targetValue: 1, unit: 'TIMES', description: '' }
  ],
  Fitness: [
    { name: 'Push Ups', icon: 'fitness_center', type: 'Quantity', targetValue: 20, unit: 'TIMES', description: 'Build strength one set at a time.' },
    { name: 'Workout', icon: 'exercise', type: 'Timer', targetValue: 30, unit: 'MINS', description: 'Move your body with a focused session.' },
    { name: 'Yoga', icon: 'self_improvement', type: 'Timer', targetValue: 20, unit: 'MINS', description: 'Improve flexibility and mindfulness.' },
    { name: 'Plank', icon: 'timer', type: 'Timer', targetValue: 2, unit: 'MINS', description: 'Build core stability.' },
    { name: 'Jump Rope', icon: 'reorder', type: 'Quantity', targetValue: 100, unit: 'TIMES', description: 'Quick cardio blast.' },
    { name: 'Stretching', icon: 'accessibility_new', type: 'Timer', targetValue: 10, unit: 'MINS', description: 'Loosen up and recover better.' },
    { name: 'Other', icon: 'add_circle', type: 'Binary', targetValue: 1, unit: 'TIMES', description: '' }
  ],
  Study: [
    { name: 'Read Book', icon: 'menu_book', type: 'Timer', targetValue: 30, unit: 'MINS', description: 'Make reading a daily rhythm.' },
    { name: 'Practice Coding', icon: 'code', type: 'Timer', targetValue: 60, unit: 'MINS', description: 'Build your technical skills.' },
    { name: 'Learn Language', icon: 'language', type: 'Timer', targetValue: 20, unit: 'MINS', description: 'Practice a new language daily.' },
    { name: 'Practice Problems', icon: 'edit_note', type: 'Quantity', targetValue: 10, unit: 'TIMES', description: 'Sharpen skills with repeat practice.' },
    { name: 'Revise Notes', icon: 'school', type: 'Binary', targetValue: 1, unit: 'TIMES', description: 'Review what matters before it fades.' },
    { name: 'Other', icon: 'add_circle', type: 'Binary', targetValue: 1, unit: 'TIMES', description: '' }
  ],
  Outdoor: [
    { name: 'Walk', icon: 'directions_walk', type: 'Distance', targetValue: 2, unit: 'KM', description: 'Get fresh air and steady movement.' },
    { name: 'Run', icon: 'directions_run', type: 'Distance', targetValue: 3, unit: 'KM', description: 'Train your pace and endurance.' },
    { name: 'Cycling', icon: 'directions_bike', type: 'Distance', targetValue: 5, unit: 'KM', description: 'Ride toward better stamina.' },
    { name: 'Hiking', icon: 'terrain', type: 'Distance', targetValue: 5, unit: 'KM', description: 'Explore trails and nature.' },
    { name: 'Gardening', icon: 'yard', type: 'Timer', targetValue: 30, unit: 'MINS', description: 'Connect with nature at home.' },
    { name: 'Other', icon: 'add_circle', type: 'Binary', targetValue: 1, unit: 'TIMES', description: '' }
  ],
  Indoor: [
    { name: 'Clean Room', icon: 'cleaning_services', type: 'Binary', targetValue: 1, unit: 'TIMES', description: 'Keep your space lighter and clearer.' },
    { name: 'Meditation', icon: 'spa', type: 'Timer', targetValue: 10, unit: 'MINS', description: 'Give your mind a quiet reset.' },
    { name: 'Journaling', icon: 'edit', type: 'Binary', targetValue: 1, unit: 'TIMES', description: 'Reflect on your day.' },
    { name: 'Play Instrument', icon: 'music_note', type: 'Timer', targetValue: 30, unit: 'MINS', description: 'Build your musical skills.' },
    { name: 'No Screen Break', icon: 'phonelink_erase', type: 'Timer', targetValue: 30, unit: 'MINS', description: 'Protect your attention from drift.' },
    { name: 'Other', icon: 'add_circle', type: 'Binary', targetValue: 1, unit: 'TIMES', description: '' }
  ],
  'Indoor Games': [
    { name: 'Chess', icon: 'person_raised_hand', type: 'Timer', targetValue: 30, unit: 'MINS', description: 'Strategic mind exercise.' },
    { name: 'Table Tennis', icon: 'sports_tennis', type: 'Timer', targetValue: 30, unit: 'MINS', description: 'Fast-paced indoor fun.' },
    { name: 'Carrom', icon: 'adjust', type: 'Binary', targetValue: 1, unit: 'TIMES', description: 'Classic indoor board game.' },
    { name: 'Billiards', icon: 'circle', type: 'Timer', targetValue: 45, unit: 'MINS', description: 'Focus and precision play.' },
    { name: 'Other', icon: 'add_circle', type: 'Binary', targetValue: 1, unit: 'TIMES', description: '' }
  ],
  'Outdoor Games': [
    { name: 'Cricket', icon: 'sports_cricket', type: 'Timer', targetValue: 60, unit: 'MINS', description: 'Classic outdoor team sport.' },
    { name: 'Football', icon: 'sports_soccer', type: 'Timer', targetValue: 45, unit: 'MINS', description: 'Cardio and team strategy.' },
    { name: 'Badminton', icon: 'sports_tennis', type: 'Timer', targetValue: 30, unit: 'MINS', description: 'Quick reflexes and movement.' },
    { name: 'Basketball', icon: 'sports_basketball', type: 'Timer', targetValue: 40, unit: 'MINS', description: 'High-energy hoop play.' },
    { name: 'Tennis', icon: 'sports_tennis', type: 'Timer', targetValue: 60, unit: 'MINS', description: 'Agility and stamina on court.' },
    { name: 'Other', icon: 'add_circle', type: 'Binary', targetValue: 1, unit: 'TIMES', description: '' }
  ]
};

const getGoalUnit = (measurementType) => {
  if (measurementType === 'Timer') return 'MINS';
  if (measurementType === 'Distance') return 'KM';
  return 'TIMES';
};

export default function CreateHabit() {
  const navigate = useNavigate();
  const { addHabit } = useHabits();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Fitness');
  const [subCategory, setSubCategory] = useState('');
  const [type, setType] = useState('Binary');
  const [frequency, setFrequency] = useState('Daily');
  const [targetValue, setTargetValue] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [reminder, setReminder] = useState('08:00');
  const [description, setDescription] = useState('');
  const [timezone, setTimezone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { name: 'Health', icon: 'health_and_safety' },
    { name: 'Fitness', icon: 'fitness_center' },
    { name: 'Study', icon: 'school' },
    { name: 'Outdoor', icon: 'directions_run' },
    { name: 'Indoor', icon: 'home' },
    { name: 'Games', icon: 'sports_esports' }
  ];

  const types = ['Binary', 'Quantity', 'Timer', 'Distance'];
  const frequencies = ['Daily', 'Weekly', 'Monthly'];
  const activeCategory = category === 'Games' ? subCategory : category;
  const templates = habitTemplates[activeCategory] || [];
  const isOtherTemplate = selectedTemplate === 'Other';

  const handleCategorySelect = (nextCategory) => {
    setCategory(nextCategory);
    setSubCategory(nextCategory === 'Games' ? 'Indoor Games' : '');
    setSelectedTemplate('');
    setName('');
    setDescription('');
    setType('Binary');
    setFrequency('Daily');
    setTargetValue(1);
    setError('');
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template.name);
    setType(template.type);
    setTargetValue(template.targetValue);
    setFrequency('Daily');
    setError('');

    if (template.name === 'Other') {
      setName('');
      setDescription('');
      return;
    }

    setName(template.name);
    setDescription(template.description);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    setError('');

    try {
      await addHabit({
        name: name.trim(),
        category,
        type,
        frequency,
        targetValue,
        reminderTime: reminder,
        description,
        timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        source: isOtherTemplate ? 'custom' : 'template'
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not save habit. Please try again.');
    } finally {
      setIsSaving(false);
    }
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
          <div className="space-y-3">
            <label className="font-label-caps text-label-caps text-on-primary-container ml-1 uppercase">Select Category</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map(cat => (
                <button 
                  key={cat.name}
                  type="button"
                  onClick={() => handleCategorySelect(cat.name)}
                  className={`rounded-xl p-4 flex flex-col items-center justify-center gap-2 border transition-all active:scale-95 duration-150 ${category === cat.name ? 'border-white/10 bg-white/10 active-ring' : 'glass-card border-white/5 hover:bg-white/10'}`}
                >
                  <span className="material-symbols-outlined text-emerald-400">{cat.icon}</span>
                  <span className={`font-label-caps text-[10px] text-on-surface uppercase ${category === cat.name ? 'font-bold' : ''}`}>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {category === 'Games' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
              <label className="font-label-caps text-label-caps text-on-primary-container ml-1 uppercase">Game Type</label>
              <div className="glass-card rounded-2xl p-2 border border-white/5 grid grid-cols-2 gap-1">
                {['Indoor Games', 'Outdoor Games'].map(sub => (
                  <button 
                    key={sub}
                    type="button"
                    onClick={() => {
                      setSubCategory(sub);
                      setSelectedTemplate('');
                      setName('');
                    }}
                    className={`py-3 rounded-xl font-label-caps text-[10px] uppercase tracking-widest transition-colors ${subCategory === sub ? 'bg-white/10 text-on-surface active-ring' : 'text-on-surface-variant hover:bg-white/5'}`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <label className="font-label-caps text-label-caps text-on-primary-container ml-1 uppercase">{activeCategory} Templates</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {templates.map(template => (
                <button
                  key={template.name}
                  type="button"
                  onClick={() => handleTemplateSelect(template)}
                  className={`rounded-xl p-4 min-h-28 flex flex-col items-center justify-center gap-2 border transition-all active:scale-95 duration-150 ${selectedTemplate === template.name ? 'border-white/10 bg-white/10 active-ring' : 'glass-card border-white/5 hover:bg-white/10'}`}
                >
                  <span className={`material-symbols-outlined ${template.name === 'Other' ? 'text-tertiary' : 'text-emerald-400'}`}>{template.icon}</span>
                  <span className={`font-label-caps text-[10px] text-center text-on-surface uppercase ${selectedTemplate === template.name ? 'font-bold' : ''}`}>{template.name}</span>
                  {template.name !== 'Other' && (
                    <span className="text-[9px] text-on-surface-variant uppercase tracking-widest">{template.targetValue} {template.unit}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {isOtherTemplate && (
            <div className="space-y-2">
              <label className="font-label-caps text-label-caps text-on-primary-container ml-1 uppercase">Habit Identity</label>
              <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
                <input 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-headline-lg font-headline-lg placeholder:text-on-surface-variant/40 p-0" 
                  placeholder="Name your habit..." 
                  type="text"
                />
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-body-md text-on-surface-variant p-0 resize-none h-10 placeholder:text-on-surface-variant/40"
                  placeholder="Optional description or motivation..."
                />
              </div>
            </div>
          )}
        </section>

        {(selectedTemplate || name.trim()) && (
          <section className="space-y-6">
            {isOtherTemplate ? (
              <div className="space-y-3">
                <label className="font-label-caps text-label-caps text-on-primary-container ml-1 uppercase">Measurement Type</label>
                <div className="glass-card rounded-2xl p-2 border border-white/5 grid grid-cols-2 md:grid-cols-4 gap-1">
                  {types.map(t => (
                    <button 
                      key={t}
                      type="button"
                      onClick={() => {
                        setType(t);
                        setTargetValue(1);
                      }}
                      className={`py-3 rounded-xl font-label-caps text-[10px] uppercase tracking-widest transition-colors ${type === t ? 'bg-white/10 text-on-surface active-ring' : 'text-on-surface-variant hover:bg-white/5'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                <div>
                  <p className="font-label-caps text-label-caps text-on-primary-container uppercase">Measurement Type</p>
                  <p className="text-on-surface font-semibold">{type}</p>
                </div>
                <span className="material-symbols-outlined text-secondary">check_circle</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-label-caps text-label-caps text-on-primary-container ml-1 uppercase">Frequency</label>
                <div className="glass-card rounded-2xl p-2 border border-white/5 grid grid-cols-3 gap-1">
                  {frequencies.map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setFrequency(item)}
                      className={`py-2.5 rounded-xl font-label-caps text-[10px] uppercase tracking-widest transition-colors ${frequency === item ? 'bg-white/10 text-on-surface active-ring' : 'text-on-surface-variant hover:bg-white/5'}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-label-caps text-on-primary-container ml-1 uppercase">Goal Value</label>
                <div className="glass-card rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                  <input 
                    type="number" 
                    min="1"
                    value={targetValue} 
                    onChange={e => setTargetValue(Number(e.target.value))} 
                    className="bg-transparent border-none focus:ring-0 text-on-surface font-body-md w-20 p-0 text-center" 
                  />
                  <span className="text-on-primary-container text-xs font-label-caps">{getGoalUnit(type)}</span>
                </div>
              </div>
            </div>
          </section>
        )}

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
        {error && (
          <p className="mb-3 rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-semibold text-error">
            {error}
          </p>
        )}
        <button onClick={handleSave} disabled={!name.trim() || isSaving} className="w-full bg-secondary text-on-secondary-container font-headline-lg text-lg py-5 rounded-2xl shadow-[0_10px_40px_rgba(78,222,163,0.25)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100">
          <span className="material-symbols-outlined">check_circle</span>
          {isSaving ? 'Saving...' : 'Save Habit'}
        </button>
      </div>
    </div>
  );
}
