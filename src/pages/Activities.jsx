import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopAppBar from '../components/layout/TopAppBar';
import { useHabits } from '../context/HabitContext';

const categories = ['Health', 'Fitness', 'Study', 'Outdoor', 'Indoor'];
const types = ['Binary', 'Quantity', 'Timer', 'Distance'];
const frequencies = ['Daily', 'Weekly', 'Monthly'];

const getGoalUnit = (type) => {
  if (type === 'Timer') return 'MINS';
  if (type === 'Distance') return 'KM';
  return 'TIMES';
};

const getHabitIcon = (habit, activeTab) => {
  if (habit.type === 'Distance') return 'directions_run';
  if (habit.type === 'Timer') return 'timer';
  if (habit.type === 'Quantity') return 'tag';
  return activeTab === 'Indoor' ? 'home' : 'park';
};

export default function Activities() {
  const navigate = useNavigate();
  const { habits, updateHabit, deleteHabit } = useHabits();

  const [activeTab, setActiveTab] = useState('Outdoor');
  const [contextMenu, setContextMenu] = useState(null);
  const [actionSheetHabit, setActionSheetHabit] = useState(null);
  const [swipeOpenId, setSwipeOpenId] = useState(null);
  const [editingHabit, setEditingHabit] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const longPressTimer = useRef(null);
  const touchStart = useRef(null);
  const didSwipe = useRef(false);

  const indoorActivities = habits.filter(h => h.category === 'Indoor' || h.category === 'Health' || h.category === 'Study');
  const outdoorActivities = habits.filter(h => h.category === 'Outdoor' || h.category === 'Fitness');
  const displayHabits = activeTab === 'Indoor' ? indoorActivities : outdoorActivities;

  useEffect(() => {
    const closeMenus = () => {
      setContextMenu(null);
      setActionSheetHabit(null);
    };

    window.addEventListener('click', closeMenus);
    window.addEventListener('scroll', closeMenus, true);
    return () => {
      window.removeEventListener('click', closeMenus);
      window.removeEventListener('scroll', closeMenus, true);
    };
  }, []);

  const openEditor = (habit) => {
    setContextMenu(null);
    setActionSheetHabit(null);
    setSwipeOpenId(null);
    setEditingHabit(habit);
    setEditForm({
      name: habit.name || '',
      category: habit.category || 'Indoor',
      type: habit.type || 'Binary',
      frequency: habit.frequency || 'Daily',
      targetValue: habit.targetValue || 1,
      reminderTime: habit.reminderTime || '08:00',
      description: habit.description || ''
    });
    setError('');
  };

  const handleDelete = async (habit) => {
    setContextMenu(null);
    setActionSheetHabit(null);
    setSwipeOpenId(null);
    const confirmed = window.confirm(`Delete "${habit.name}"? This will also remove its logs.`);
    if (!confirmed) return;

    try {
      await deleteHabit(habit.id);
    } catch (err) {
      setError(err.message || 'Could not delete habit.');
    }
  };

  const handleEditSave = async () => {
    if (!editingHabit || !editForm.name.trim()) return;
    setSaving(true);
    setError('');

    try {
      await updateHabit(editingHabit.id, {
        ...editForm,
        name: editForm.name.trim(),
        targetValue: Number(editForm.targetValue) > 0 ? Number(editForm.targetValue) : 1
      });
      setEditingHabit(null);
      setEditForm(null);
    } catch (err) {
      setError(err.message || 'Could not update habit.');
    } finally {
      setSaving(false);
    }
  };

  const handleCardContextMenu = (event, habit) => {
    event.preventDefault();
    setActionSheetHabit(null);
    setSwipeOpenId(null);
    setContextMenu({
      habit,
      x: Math.min(event.clientX, window.innerWidth - 180),
      y: Math.min(event.clientY, window.innerHeight - 120)
    });
  };

  const handlePointerDown = (event, habit) => {
    if (event.pointerType === 'mouse') return;
    didSwipe.current = false;
    touchStart.current = { x: event.clientX, y: event.clientY, habitId: habit.id };
    window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => {
      setContextMenu(null);
      setSwipeOpenId(null);
      setActionSheetHabit(habit);
    }, 550);
  };

  const handlePointerMove = (event, habit) => {
    if (!touchStart.current || touchStart.current.habitId !== habit.id) return;

    const deltaX = event.clientX - touchStart.current.x;
    const deltaY = event.clientY - touchStart.current.y;
    if (Math.abs(deltaX) > 12 || Math.abs(deltaY) > 12) {
      window.clearTimeout(longPressTimer.current);
    }

    if (deltaX < -48 && Math.abs(deltaY) < 40) {
      didSwipe.current = true;
      setContextMenu(null);
      setActionSheetHabit(null);
      setSwipeOpenId(habit.id);
    }

    if (deltaX > 32 && swipeOpenId === habit.id) {
      setSwipeOpenId(null);
    }
  };

  const handlePointerUp = () => {
    window.clearTimeout(longPressTimer.current);
    touchStart.current = null;
    window.setTimeout(() => {
      didSwipe.current = false;
    }, 0);
  };

  const handleCardClick = (habit) => {
    if (didSwipe.current || swipeOpenId === habit.id) {
      setSwipeOpenId(null);
      return;
    }
    navigate(`/habit/${habit.id}`);
  };

  const renderActions = (habit, compact = false) => (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          openEditor(habit);
        }}
        className={`${compact ? 'h-full w-16 justify-center' : 'w-full justify-start px-4 py-3'} flex items-center gap-2 rounded-xl text-on-surface hover:bg-white/10 transition-colors`}
      >
        <span className="material-symbols-outlined text-secondary">edit</span>
        {!compact && <span className="font-semibold">Edit</span>}
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          handleDelete(habit);
        }}
        className={`${compact ? 'h-full w-16 justify-center' : 'w-full justify-start px-4 py-3'} flex items-center gap-2 rounded-xl text-error hover:bg-error/10 transition-colors`}
      >
        <span className="material-symbols-outlined">delete</span>
        {!compact && <span className="font-semibold">Delete</span>}
      </button>
    </>
  );

  return (
    <>
      <TopAppBar title="Activities" />
      <main className="mt-20 px-6 max-w-2xl mx-auto pb-32">
        <div className="flex gap-4 mb-8 bg-surface-container-high p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('Indoor');
              setSwipeOpenId(null);
            }}
            className={`flex-1 py-3 rounded-xl font-label-caps tracking-widest text-sm transition-all duration-300 flex justify-center items-center gap-2 ${activeTab === 'Indoor' ? 'bg-secondary text-on-secondary-container shadow-md' : 'text-on-surface-variant hover:bg-white/5'}`}
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            Indoor
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('Outdoor');
              setSwipeOpenId(null);
            }}
            className={`flex-1 py-3 rounded-xl font-label-caps tracking-widest text-sm transition-all duration-300 flex justify-center items-center gap-2 ${activeTab === 'Outdoor' ? 'bg-secondary text-on-secondary-container shadow-md' : 'text-on-surface-variant hover:bg-white/5'}`}
          >
            <span className="material-symbols-outlined text-[18px]">park</span>
            Outdoor
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-semibold text-error">
            {error}
          </p>
        )}

        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {displayHabits.length === 0 ? (
            <div className="text-center p-8 glass-card rounded-3xl border border-white/5">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/50 mb-4 block">
                {activeTab === 'Indoor' ? 'chair' : 'directions_run'}
              </span>
              <p className="text-on-surface-variant">No {activeTab.toLowerCase()} activities found.</p>
              <button onClick={() => navigate('/new')} className="mt-4 text-secondary text-sm font-label-caps uppercase tracking-widest hover:underline">
                Create one
              </button>
            </div>
          ) : (
            displayHabits.map(habit => (
              <div key={habit.id} className="relative overflow-hidden rounded-3xl">
                <div className="absolute inset-y-0 right-0 flex items-stretch gap-1 rounded-3xl bg-surface p-2">
                  {renderActions(habit, true)}
                </div>

                <div
                  onClick={() => handleCardClick(habit)}
                  onContextMenu={(event) => handleCardContextMenu(event, habit)}
                  onPointerDown={(event) => handlePointerDown(event, habit)}
                  onPointerMove={(event) => handlePointerMove(event, habit)}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className={`bg-surface p-5 rounded-3xl border border-outline-variant/40 flex items-center justify-between hover:border-secondary/30 transition-all cursor-pointer active:scale-[0.98] group relative z-10 touch-pan-y ${swipeOpenId === habit.id ? '-translate-x-36' : 'translate-x-0'}`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border border-outline-variant/40 text-secondary">
                      <span className="material-symbols-outlined">
                        {getHabitIcon(habit, activeTab)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-on-surface font-headline-lg truncate">{habit.name}</h3>
                      <p className="text-on-surface-variant text-sm flex items-center gap-1 truncate">
                        <span className="material-symbols-outlined text-[14px]">category</span>
                        {habit.category} • {habit.type}
                      </p>
                    </div>
                  </div>
                  {habit.type === 'Distance' && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/track/${habit.id}`);
                      }}
                      className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary hover:bg-secondary/20 transition-colors shrink-0"
                      title="Start Tracking"
                    >
                      <span className="material-symbols-outlined">explore</span>
                    </button>
                  )}
                  {habit.type !== 'Distance' && (
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-white transition-colors shrink-0">
                      chevron_right
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {contextMenu && (
        <div
          className="fixed z-[80] w-44 glass-card rounded-2xl border border-white/10 p-2 shadow-2xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          {renderActions(contextMenu.habit)}
        </div>
      )}

      {actionSheetHabit && (
        <div className="fixed inset-0 z-[80] bg-black/40 flex items-end px-4 pb-6 md:hidden" onClick={() => setActionSheetHabit(null)}>
          <div className="w-full glass-card rounded-3xl border border-white/10 p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 px-2">
              <p className="font-bold text-on-surface">{actionSheetHabit.name}</p>
              <p className="text-sm text-on-surface-variant">{actionSheetHabit.category} • {actionSheetHabit.type}</p>
            </div>
            {renderActions(actionSheetHabit)}
            <button
              type="button"
              onClick={() => setActionSheetHabit(null)}
              className="mt-2 w-full rounded-xl px-4 py-3 text-on-surface-variant hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {editingHabit && editForm && (
        <div className="fixed inset-0 z-[90] bg-black/50 px-4 py-8 flex items-center justify-center">
          <div className="w-full max-w-lg glass-card rounded-3xl border border-white/10 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-label-caps text-label-caps text-on-primary-container uppercase">Edit Habit</p>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">{editingHabit.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingHabit(null)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="font-label-caps text-label-caps text-on-primary-container uppercase">Name</label>
                <input
                  value={editForm.name}
                  onChange={(event) => setEditForm(prev => ({ ...prev, name: event.target.value }))}
                  className="w-full glass-card rounded-2xl border border-white/5 bg-transparent px-4 py-3 text-on-surface focus:ring-0"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-on-primary-container uppercase">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(event) => setEditForm(prev => ({ ...prev, category: event.target.value }))}
                    className="w-full glass-card rounded-2xl border border-white/5 bg-surface px-4 py-3 text-on-surface focus:ring-0"
                  >
                    {categories.map(category => <option key={category}>{category}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-on-primary-container uppercase">Type</label>
                  <select
                    value={editForm.type}
                    onChange={(event) => setEditForm(prev => ({ ...prev, type: event.target.value, targetValue: 1 }))}
                    className="w-full glass-card rounded-2xl border border-white/5 bg-surface px-4 py-3 text-on-surface focus:ring-0"
                  >
                    {types.map(type => <option key={type}>{type}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-on-primary-container uppercase">Frequency</label>
                  <div className="glass-card rounded-2xl p-2 border border-white/5 grid grid-cols-3 gap-1">
                    {frequencies.map(item => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setEditForm(prev => ({ ...prev, frequency: item }))}
                        className={`py-2.5 rounded-xl font-label-caps text-[10px] uppercase tracking-widest transition-colors ${editForm.frequency === item ? 'bg-white/10 text-on-surface active-ring' : 'text-on-surface-variant hover:bg-white/5'}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-on-primary-container uppercase">Goal Value</label>
                  <div className="glass-card rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                    <input
                      type="number"
                      min="1"
                      value={editForm.targetValue}
                      onChange={(event) => setEditForm(prev => ({ ...prev, targetValue: Number(event.target.value) }))}
                      className="bg-transparent border-none focus:ring-0 text-on-surface font-body-md w-20 p-0 text-center"
                    />
                    <span className="text-on-primary-container text-xs font-label-caps">{getGoalUnit(editForm.type)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-on-primary-container uppercase">Reminder</label>
                  <input
                    type="time"
                    value={editForm.reminderTime}
                    onChange={(event) => setEditForm(prev => ({ ...prev, reminderTime: event.target.value }))}
                    className="w-full glass-card rounded-2xl border border-white/5 bg-transparent px-4 py-3 text-secondary font-bold focus:ring-0"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label-caps text-label-caps text-on-primary-container uppercase">Description</label>
                  <input
                    value={editForm.description}
                    onChange={(event) => setEditForm(prev => ({ ...prev, description: event.target.value }))}
                    className="w-full glass-card rounded-2xl border border-white/5 bg-transparent px-4 py-3 text-on-surface focus:ring-0"
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setEditingHabit(null)}
                className="flex-1 rounded-2xl border border-white/10 py-4 text-on-surface hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditSave}
                disabled={!editForm.name.trim() || saving}
                className="flex-1 rounded-2xl bg-secondary py-4 font-bold text-on-secondary-container shadow-[0_10px_30px_rgba(78,222,163,0.2)] disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
