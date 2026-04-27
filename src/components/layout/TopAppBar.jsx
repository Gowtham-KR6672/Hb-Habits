import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function TopAppBar({ title = "HB Habits", showBack = false }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-outline-variant/30 flex items-center justify-between px-6 py-4 font-manrope antialiased tracking-tight">
      <div className="flex items-center gap-4">
        {showBack ? (
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-on-surface/5 transition-colors active:scale-95">
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </button>
        ) : (
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border border-outline-variant/50 p-1">
            <img alt="App logo" className="w-full h-full object-contain" src="/logo.png" />
          </div>
        )}
        <h1 className="text-xl font-extrabold text-on-surface">{title}</h1>
      </div>
      <button className="text-on-surface-variant hover:bg-on-surface/5 transition-colors p-2 rounded-full active:scale-95 duration-150">
        <span className="material-symbols-outlined">calendar_today</span>
      </button>
    </header>
  );
}
