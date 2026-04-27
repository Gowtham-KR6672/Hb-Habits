import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [view, setView] = useState('login'); // login, forgot-request, forgot-verify
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to login');
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('userEmail', data.email);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request reset');
      setView('forgot-verify');
      setSuccess('Reset code sent to your email.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotVerify = async (e) => {
    e.preventDefault();
    if (!otp || !newPassword) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      setView('login');
      setSuccess('Password updated! You can now log in.');
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body-md flex flex-col items-center justify-center p-6 selection:bg-secondary/30">
      <div className="w-full max-w-md glass-card rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-secondary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-tertiary/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="Logo" className="w-20 h-20 rounded-2xl shadow-lg border border-white/10" />
          </div>
          
          <h1 className="text-3xl font-headline-xl font-bold text-center mb-2">
            {view === 'login' && 'Welcome Back'}
            {view === 'forgot-request' && 'Reset Password'}
            {view === 'forgot-verify' && 'Enter Reset Code'}
          </h1>

          {error && <div className="bg-error-container/20 border border-error-container text-error rounded-xl p-3 mb-6 text-sm text-center">{error}</div>}
          {success && <div className="bg-secondary-container/20 border border-secondary text-secondary rounded-xl p-3 mb-6 text-sm text-center">{success}</div>}

          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="font-label-caps text-xs text-on-primary-container uppercase tracking-widest ml-1">Email</label>
                  <div className="glass-card rounded-xl p-4 border border-white/10 mt-1">
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-transparent border-none focus:ring-0 text-on-surface p-0 placeholder:text-on-surface-variant/40" placeholder="you@example.com" required />
                  </div>
                </div>
                <div>
                  <label className="font-label-caps text-xs text-on-primary-container uppercase tracking-widest ml-1">Password</label>
                  <div className="glass-card rounded-xl p-4 border border-white/10 mt-1">
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-transparent border-none focus:ring-0 text-on-surface p-0 placeholder:text-on-surface-variant/40" placeholder="••••••••" required />
                  </div>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-secondary text-on-secondary-container font-headline-lg text-lg py-4 rounded-xl shadow-[0_10px_40px_rgba(78,222,163,0.25)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? 'Logging in...' : 'Log In'}
              </button>
              <div className="flex justify-between text-sm px-1">
                <button type="button" onClick={() => { setView('forgot-request'); setError(''); setSuccess(''); }} className="text-on-surface-variant hover:text-secondary transition-colors">Forgot Password?</button>
                <Link to="/register" className="text-secondary hover:underline transition-colors font-bold">Sign Up</Link>
              </div>
            </form>
          )}

          {view === 'forgot-request' && (
            <form onSubmit={handleForgotRequest} className="space-y-6">
              <div>
                <label className="font-label-caps text-xs text-on-primary-container uppercase tracking-widest ml-1">Account Email</label>
                <div className="glass-card rounded-xl p-4 border border-white/10 mt-1">
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-transparent border-none focus:ring-0 text-on-surface p-0 placeholder:text-on-surface-variant/40" placeholder="you@example.com" required />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-tertiary text-on-tertiary-container font-headline-lg text-lg py-4 rounded-xl shadow-[0_10px_40px_rgba(255,185,95,0.25)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
              <div className="text-center">
                <button type="button" onClick={() => setView('login')} className="text-sm text-on-surface-variant hover:text-white transition-colors">Back to Login</button>
              </div>
            </form>
          )}

          {view === 'forgot-verify' && (
            <form onSubmit={handleForgotVerify} className="space-y-6">
              <div>
                <label className="font-label-caps text-xs text-on-primary-container uppercase tracking-widest ml-1">6-Digit Code</label>
                <div className="glass-card rounded-xl p-4 border border-white/10 mt-1">
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0,6))} className="w-full bg-transparent border-none focus:ring-0 text-headline-lg tracking-[0.5em] text-center text-on-surface p-0 placeholder:text-on-surface-variant/40" placeholder="••••••" required />
                </div>
              </div>
              <div>
                <label className="font-label-caps text-xs text-on-primary-container uppercase tracking-widest ml-1">New Password</label>
                <div className="glass-card rounded-xl p-4 border border-white/10 mt-1">
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-transparent border-none focus:ring-0 text-on-surface p-0 placeholder:text-on-surface-variant/40" placeholder="••••••••" required />
                </div>
              </div>
              <button type="submit" disabled={loading || otp.length < 6 || newPassword.length < 6} className="w-full bg-secondary text-on-secondary-container font-headline-lg text-lg py-4 rounded-xl shadow-[0_10px_40px_rgba(78,222,163,0.25)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? 'Updating...' : 'Update Password'}
              </button>
              <div className="text-center">
                <button type="button" onClick={() => setView('login')} className="text-sm text-on-surface-variant hover:text-white transition-colors">Cancel</button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
