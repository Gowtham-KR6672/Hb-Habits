import React from 'react';
import { NavLink } from 'react-router-dom';

export default function BottomNavBar() {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-4 pb-6 pt-3 bg-background/90 backdrop-blur-2xl rounded-t-3xl border-t border-outline-variant/30 shadow-[0_-10px_40px_rgba(0,0,0,0.15)]">
      <NavLink to="/" className={({ isActive }) => `flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'text-secondary scale-110' : 'text-on-surface-variant opacity-60 hover:opacity-100'}`}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
        <span className="font-manrope text-[10px] font-semibold uppercase tracking-widest mt-1">Home</span>
      </NavLink>

      <NavLink to="/analytics" className={({ isActive }) => `flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'text-secondary scale-110' : 'text-on-surface-variant opacity-60 hover:opacity-100'}`}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
        <span className="font-manrope text-[10px] font-semibold uppercase tracking-widest mt-1">Analytics</span>
      </NavLink>

      <NavLink to="/new" className={({ isActive }) => `flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'text-secondary scale-110' : 'text-on-surface-variant opacity-60 hover:opacity-100'}`}>
        <span className="material-symbols-outlined text-2xl">add_circle</span>
        <span className="font-manrope text-[10px] font-semibold uppercase tracking-widest mt-1">Add</span>
      </NavLink>

      <NavLink to="/activities" className={({ isActive }) => `flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'text-secondary scale-110' : 'text-on-surface-variant opacity-60 hover:opacity-100'}`}>
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>directions_run</span>
        <span className="font-manrope text-[10px] font-semibold uppercase tracking-widest mt-1">Activities</span>
      </NavLink>

      <NavLink to="/profile" className={({ isActive }) => `flex flex-col items-center justify-center transition-all duration-300 ${isActive ? 'text-secondary scale-110' : 'text-on-surface-variant opacity-60 hover:opacity-100'}`}>
        <span className="material-symbols-outlined">person</span>
        <span className="font-manrope text-[10px] font-semibold uppercase tracking-widest mt-1">Profile</span>
      </NavLink>
    </nav>
  );
}
