import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopAppBar from '../components/layout/TopAppBar';
import { useHabits } from '../context/HabitContext';

export default function Activities() {
  const navigate = useNavigate();
  const { habits } = useHabits();
  
  const [activeTab, setActiveTab] = useState('Outdoor'); // 'Indoor' or 'Outdoor'

  const indoorActivities = habits.filter(h => h.category === 'Indoor' || h.category === 'Health' || h.category === 'Study');
  const outdoorActivities = habits.filter(h => h.category === 'Outdoor' || h.category === 'Fitness');

  const displayHabits = activeTab === 'Indoor' ? indoorActivities : outdoorActivities;

  return (
    <>
      <TopAppBar title="Activities" />
      <main className="mt-20 px-6 max-w-2xl mx-auto pb-32">
        <div className="flex gap-4 mb-8 bg-surface-container-high p-1.5 rounded-2xl">
          <button 
            onClick={() => setActiveTab('Indoor')}
            className={`flex-1 py-3 rounded-xl font-label-caps tracking-widest text-sm transition-all duration-300 flex justify-center items-center gap-2 ${activeTab === 'Indoor' ? 'bg-secondary text-on-secondary-container shadow-md' : 'text-on-surface-variant hover:bg-white/5'}`}
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            Indoor
          </button>
          <button 
            onClick={() => setActiveTab('Outdoor')}
            className={`flex-1 py-3 rounded-xl font-label-caps tracking-widest text-sm transition-all duration-300 flex justify-center items-center gap-2 ${activeTab === 'Outdoor' ? 'bg-secondary text-on-secondary-container shadow-md' : 'text-on-surface-variant hover:bg-white/5'}`}
          >
            <span className="material-symbols-outlined text-[18px]">park</span>
            Outdoor
          </button>
        </div>

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
              <div 
                key={habit.id} 
                onClick={() => navigate(`/habit/${habit.id}`)}
                className="glass-card p-5 rounded-3xl border border-white/5 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer active:scale-[0.98] group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeTab === 'Indoor' ? 'bg-tertiary/10 text-tertiary' : 'bg-primary/10 text-primary'}`}>
                    <span className="material-symbols-outlined">
                      {activeTab === 'Indoor' ? 'home' : 'directions_run'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-on-surface font-headline-lg">{habit.name}</h3>
                    <p className="text-on-surface-variant text-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">category</span>
                      {habit.category} • {habit.type}
                    </p>
                  </div>
                </div>
                {habit.type === 'Distance' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate(`/track/${habit.id}`); }}
                    className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary hover:bg-secondary/20 transition-colors"
                    title="Start Tracking"
                  >
                    <span className="material-symbols-outlined">explore</span>
                  </button>
                )}
                {habit.type !== 'Distance' && (
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-white transition-colors">
                    chevron_right
                  </span>
                )}
              </div>
            ))
          )}
        </section>
      </main>
    </>
  );
}
