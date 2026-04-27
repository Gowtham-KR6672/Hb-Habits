import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/register/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('userEmail', data.email);
      navigate('/');
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
          
          <h1 className="text-3xl font-headline-xl font-bold text-center mb-2">Create Account</h1>
          <p className="text-center text-on-surface-variant mb-8">
            {step === 1 ? 'Start tracking your habits' : 'Enter the code sent to your email'}
          </p>

          {error && <div className="bg-error-container/20 border border-error-container text-error rounded-xl p-3 mb-6 text-sm text-center">{error}</div>}

          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-6">
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
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-transparent border-none focus:ring-0 text-on-surface p-0 placeholder:text-on-surface-variant/40" placeholder="••••••••" required minLength="6" />
                  </div>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-secondary text-on-secondary-container font-headline-lg text-lg py-4 rounded-xl shadow-[0_10px_40px_rgba(78,222,163,0.25)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? 'Sending Code...' : 'Sign Up'}
              </button>
              <div className="text-center text-sm px-1 mt-4">
                <span className="text-on-surface-variant">Already have an account? </span>
                <Link to="/login" className="text-secondary hover:underline transition-colors font-bold">Log In</Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="font-label-caps text-xs text-on-primary-container uppercase tracking-widest ml-1">6-Digit Code</label>
                <div className="glass-card rounded-xl p-4 border border-white/10 mt-1">
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0,6))} className="w-full bg-transparent border-none focus:ring-0 text-headline-lg tracking-[0.5em] text-center text-on-surface p-0 placeholder:text-on-surface-variant/40" placeholder="••••••" required />
                </div>
              </div>
              <button type="submit" disabled={loading || otp.length < 6} className="w-full bg-secondary text-on-secondary-container font-headline-lg text-lg py-4 rounded-xl shadow-[0_10px_40px_rgba(78,222,163,0.25)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? 'Verifying...' : 'Verify & Create Account'}
              </button>
              <div className="text-center mt-4">
                <button type="button" onClick={() => setStep(1)} className="text-sm text-on-surface-variant hover:text-white transition-colors">Wrong email? Go back</button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
