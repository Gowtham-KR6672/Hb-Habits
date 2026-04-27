import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopAppBar from '../components/layout/TopAppBar';
import { applyTheme } from '../App';

export default function Profile() {
  const [activeTab, setActiveTab] = useState(null); // null means showing list of options
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Account Deletion States
  const [deleteView, setDeleteView] = useState('none'); // none, request, verify
  const [otp, setOtp] = useState('');

  const [legalView, setLegalView] = useState(null); // 'privacy', 'terms', 'agreement', null

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userEmail = localStorage.getItem('userEmail') || 'User';

  const [formData, setFormData] = useState({
    fullName: '', mobileNumber: '', height: '', weight: '', timezone: '', ageRange: '', gender: '', occupation: '',
    wakeUpTime: '', sleepTime: '', activeHours: '', preferredReminderTime: '',
    notificationsEnabled: true, reminderFrequency: 'Once',
    channels: { push: true, email: false },
    whyBuildingHabits: '', biggestChallenge: '', motivationStyle: '',
    theme: 'Dark', dashboardStyle: 'Minimal', weekStartsOn: 'Monday'
  });

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setFormData(prev => ({ ...prev, timezone: tz }));

    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok) {
          setFormData(prev => ({ ...prev, ...data }));
          if (data.theme) {
            localStorage.setItem('theme', data.theme);
            applyTheme(data.theme);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save profile');

      localStorage.setItem('theme', formData.theme);
      applyTheme(formData.theme);

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleNestedChange = (parent, field, value) => setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [field]: value } }));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  const handleDeleteRequest = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/account/delete/request', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request deletion');
      setDeleteView('verify');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVerify = async (e) => {
    e.preventDefault();
    if (!otp) return;
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/account/delete/verify', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');

      localStorage.clear();
      window.location.href = '/register';
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (label, field, type = 'text', placeholder = '') => (
    <div className="space-y-1">
      <label className="font-label-caps text-[10px] text-on-primary-container uppercase tracking-widest ml-1">{label}</label>
      <input type={type} value={formData[field] || ''} onChange={e => handleChange(field, e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:ring-1 focus:ring-secondary text-on-surface font-body-md" placeholder={placeholder} />
    </div>
  );

  const renderSelect = (label, field, options) => (
    <div className="space-y-1">
      <label className="font-label-caps text-[10px] text-on-primary-container uppercase tracking-widest ml-1">{label}</label>
      <select value={formData[field] || ''} onChange={e => handleChange(field, e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:ring-1 focus:ring-secondary text-on-surface font-body-md appearance-none">
        <option value="" className="bg-background text-on-surface">Select option</option>
        {options.map(opt => <option key={opt} value={opt} className="bg-background text-on-surface">{opt}</option>)}
      </select>
    </div>
  );

  const options = [
    { id: 'Identity', title: 'Identity', icon: 'badge', desc: 'Personal details and demographics' },
    { id: 'Schedule', title: 'Schedule & Routine', icon: 'schedule', desc: 'Wake times, active hours, notifications' },
    { id: 'Motivation', title: 'Motivation', icon: 'psychology', desc: 'Goals and challenges' },
    { id: 'Preferences', title: 'UI Preferences', icon: 'palette', desc: 'Theme and dashboard layout' },
    { id: 'AppInfo', title: 'App Info', icon: 'info', desc: 'Version, privacy policy & terms' },
    { id: 'Account', title: 'Account Settings', icon: 'manage_accounts', desc: 'Logout and deletion' }
  ];

  if (loading) return <div className="min-h-screen bg-background text-on-surface flex items-center justify-center">Loading...</div>;

  return (
    <>
      <TopAppBar title={activeTab === 'AppInfo' ? 'App Info' : activeTab ? activeTab : "Profile Settings"} />
      <main className="mt-20 px-6 max-w-2xl mx-auto pb-32">

        {!activeTab && (
          <div className="space-y-8 animate-in fade-in duration-300 pt-4">
            <section className="flex flex-col items-center justify-center text-center pb-4 pt-2">
              <div className="w-56 h-56 rounded-full border-[8px] border-background overflow-hidden mb-6 shadow-[0_15px_50px_rgba(0,0,0,0.6)] mx-auto bg-surface-container-highest flex items-center justify-center relative">
                <img src="/logo.png" alt="User profile" className="w-full h-full object-cover p-2 bg-white" />
                <div className="absolute inset-0 border border-white/10 rounded-full"></div>
              </div>

              <h2 className="font-headline-xl text-3xl text-on-surface font-bold mb-2 tracking-tight">
                {formData.fullName || 'HB Habits User'}
              </h2>

              <div className="space-y-1.5 mt-1">
                <p className="text-on-surface-variant font-body-md flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                  {userEmail}
                </p>

                {formData.mobileNumber && (
                  <p className="text-on-surface-variant font-body-md flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">phone</span>
                    {formData.mobileNumber}
                  </p>
                )}

                <div className="pt-2">
                  <p className="text-secondary/90 font-label-caps text-xs tracking-widest uppercase inline-block bg-secondary/10 px-4 py-1.5 rounded-full border border-secondary/20">
                    Member since {formData._id ? new Date(parseInt(formData._id.substring(0, 8), 16) * 1000).getFullYear() : new Date().getFullYear()}
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              {options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setActiveTab(opt.id)}
                  className="w-full glass-card border border-white/5 p-4 rounded-xl flex items-center justify-between hover:bg-white/10 transition-colors group text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-on-surface-variant group-hover:text-secondary transition-colors">
                      <span className="material-symbols-outlined">{opt.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-body-md text-on-surface">{opt.title}</h3>
                      <p className="font-body-sm text-on-surface-variant text-xs">{opt.desc}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                </button>
              ))}
            </section>
          </div>
        )}

        {activeTab && (
          <div className="animate-in slide-in-from-right-4 duration-300 pt-4">
            <button onClick={() => { setActiveTab(null); setError(''); setSuccess(''); }} className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors mb-6">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span className="font-label-caps text-xs uppercase tracking-widest">Back to Profile</span>
            </button>

            {error && <div className="bg-error/20 text-error p-3 rounded-xl mb-4 text-sm text-center">{error}</div>}
            {success && <div className="bg-secondary/20 text-secondary p-3 rounded-xl mb-4 text-sm text-center">{success}</div>}

            <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-6">
              {activeTab === 'Identity' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderInput('Full Name', 'fullName')}
                    {renderInput('Mobile Number', 'mobileNumber', 'tel')}
                    {renderInput('Height', 'height', 'text', "e.g., 5'10\" or 178cm")}
                    {renderInput('Weight', 'weight', 'text', 'e.g., 160lbs or 72kg')}
                    {renderInput('Timezone', 'timezone')}
                    {renderSelect('Age Range', 'ageRange', ['Under 18', '18-24', '25-34', '35-44', '45-54', '55+'])}
                    {renderSelect('Gender (Optional)', 'gender', ['Male', 'Female', 'Non-Binary', 'Prefer not to say'])}
                    {renderSelect('Occupation', 'occupation', ['Student', 'Working Professional', 'Freelancer', 'Other'])}
                  </div>
                </div>
              )}

              {activeTab === 'Schedule' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderInput('Wake-up Time', 'wakeUpTime', 'time')}
                    {renderInput('Sleep Time', 'sleepTime', 'time')}
                    {renderInput('Active Hours (e.g., 9AM - 5PM)', 'activeHours')}
                    {renderInput('Preferred Reminder Time(s)', 'preferredReminderTime')}
                  </div>
                  <h3 className="font-headline-lg text-base text-on-surface mt-6 mb-2 border-t border-white/5 pt-4">Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between glass-card p-4 rounded-xl border border-white/5">
                      <span className="text-on-surface text-sm">Enable Notifications</span>
                      <input type="checkbox" checked={formData.notificationsEnabled} onChange={e => handleChange('notificationsEnabled', e.target.checked)} className="accent-secondary w-5 h-5" />
                    </div>
                    {renderSelect('Reminder Frequency', 'reminderFrequency', ['Once', 'Repeated until completed'])}
                    <div className="flex gap-4 glass-card p-4 rounded-xl border border-white/5">
                      <label className="flex items-center gap-2 text-on-surface text-sm flex-1">
                        <input type="checkbox" checked={formData.channels.push} onChange={e => handleNestedChange('channels', 'push', e.target.checked)} className="accent-secondary" /> Push
                      </label>
                      <label className="flex items-center gap-2 text-on-surface text-sm flex-1 border-l border-white/5 pl-4">
                        <input type="checkbox" checked={formData.channels.email} onChange={e => handleNestedChange('channels', 'email', e.target.checked)} className="accent-secondary" /> Email
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'Motivation' && (
                <div className="space-y-4">
                  {renderInput('Why are you building habits?', 'whyBuildingHabits', 'text', 'e.g., Discipline, Health, Career')}
                  {renderSelect('Biggest Challenge', 'biggestChallenge', ['Consistency', 'Time', 'Motivation', 'Other'])}
                  {renderSelect('Motivation Style', 'motivationStyle', ['Rewards', 'Streaks', 'Reminders', 'Community'])}
                </div>
              )}

              {activeTab === 'Preferences' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderSelect('Theme', 'theme', ['Dark', 'Light', 'System'])}
                    {renderSelect('Dashboard Style', 'dashboardStyle', ['Minimal', 'Detailed analytics'])}
                    {renderSelect('Week Starts On', 'weekStartsOn', ['Sunday', 'Monday'])}
                  </div>
                </div>
              )}

              {activeTab === 'AppInfo' && !legalView && (
                <div className="space-y-6">
                  <div className="glass-card p-6 rounded-xl border border-white/5 text-center">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white shadow-lg flex items-center justify-center p-2 border-2 border-surface">
                      <img src="/logo.png" alt="HB Habits Logo" className="w-full h-full object-contain rounded-full" />
                    </div>
                    <h3 className="text-xl font-bold text-on-surface">HB Habits</h3>
                    <p className="text-on-surface-variant text-sm mt-1">Version 1.0.0</p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-label-caps text-[10px] text-on-primary-container uppercase tracking-widest ml-1">Legal & Privacy</h4>

                    <button onClick={() => setLegalView('privacy')} className="w-full glass-card border border-white/5 p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors group">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary group-hover:text-emerald-400 transition-colors">shield</span>
                        <span className="font-body-md text-on-surface">Privacy Policy</span>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant">open_in_new</span>
                    </button>

                    <button onClick={() => setLegalView('terms')} className="w-full glass-card border border-white/5 p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors group">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary group-hover:text-emerald-400 transition-colors">gavel</span>
                        <span className="font-body-md text-on-surface">Terms of Service</span>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant">open_in_new</span>
                    </button>

                    <button onClick={() => setLegalView('agreement')} className="w-full glass-card border border-white/5 p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors group">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-secondary group-hover:text-emerald-400 transition-colors">description</span>
                        <span className="font-body-md text-on-surface">User Agreement</span>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant">open_in_new</span>
                    </button>
                  </div>
                  
                  <div className="pt-8 pb-4 text-center">
                    <p className="text-on-surface-variant text-xs font-medium tracking-wide">© {new Date().getFullYear()} HB Habits. All rights reserved.</p>
                  </div>
                </div>
              )}

              {activeTab === 'AppInfo' && legalView && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <button onClick={() => setLegalView(null)} className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                    <span className="font-body-md">Back to App Info</span>
                  </button>
                  <div className="glass-card p-6 rounded-xl border border-white/5 text-on-surface space-y-4 text-sm leading-relaxed max-h-[65vh] overflow-y-auto">
                    {legalView === 'privacy' && (
                      <>
                        <h2 className="text-xl font-bold text-secondary mb-2">Privacy Policy</h2>
                        <p className="text-on-surface-variant italic mb-4">Effective Date: January 1, 2026</p>
                        <p>Your privacy is important to us. It is HB Habits' policy to respect your privacy regarding any information we may collect from you across our application.</p>
                        <h3 className="font-bold text-on-surface mt-6 mb-1 border-b border-white/10 pb-1">1. Information We Collect</h3>
                        <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent.</p>
                        <h3 className="font-bold text-on-surface mt-6 mb-1 border-b border-white/10 pb-1">2. Use of Information</h3>
                        <p>The information we collect is used to customize your habit tracking experience, securely save your progress, send requested reminders, and improve our services.</p>
                        <h3 className="font-bold text-on-surface mt-6 mb-1 border-b border-white/10 pb-1">3. Data Storage and Security</h3>
                        <p>We don't share any personally identifying information publicly or with third-parties, except when required to by law. Your data is encrypted and stored securely.</p>
                      </>
                    )}
                    {legalView === 'terms' && (
                      <>
                        <h2 className="text-xl font-bold text-secondary mb-2">Terms of Service</h2>
                        <h3 className="font-bold text-on-surface mt-6 mb-1 border-b border-white/10 pb-1">1. Terms</h3>
                        <p>By accessing the HB Habits application, you are agreeing to be bound by these terms of service, all applicable laws and regulations.</p>
                        <h3 className="font-bold text-on-surface mt-6 mb-1 border-b border-white/10 pb-1">2. Use License</h3>
                        <p>Permission is granted to temporarily download one copy of the materials on HB Habits for personal, non-commercial transitory viewing only.</p>
                        <h3 className="font-bold text-on-surface mt-6 mb-1 border-b border-white/10 pb-1">3. Disclaimer</h3>
                        <p>The materials on HB Habits are provided on an 'as is' basis. HB Habits makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties.</p>
                      </>
                    )}
                    {legalView === 'agreement' && (
                      <>
                        <h2 className="text-xl font-bold text-secondary mb-2">User Agreement</h2>
                        <p>This User Agreement constitutes a legally binding agreement made between you and HB Habits, concerning your access to and use of the application.</p>
                        <h3 className="font-bold text-on-surface mt-6 mb-1 border-b border-white/10 pb-1">User Representations</h3>
                        <p>By using the Application, you represent and warrant that all registration information you submit will be true, accurate, current, and complete.</p>
                        <h3 className="font-bold text-on-surface mt-6 mb-1 border-b border-white/10 pb-1">Prohibited Activities</h3>
                        <p>You may not access or use the Application for any purpose other than that for which we make the Application available. The Application may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.</p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {activeTab !== 'Account' && activeTab !== 'AppInfo' && (
                <div className="pt-4 mt-6 border-t border-white/5">
                  <button onClick={handleSave} disabled={saving} className="w-full bg-secondary text-on-secondary-container font-headline-lg py-4 rounded-xl shadow-[0_5px_20px_rgba(78,222,163,0.2)] active:scale-[0.98] transition-all disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}

              {activeTab === 'Account' && (
                <div className="space-y-6">
                  {deleteView === 'none' && (
                    <div className="space-y-4">
                      <button onClick={handleLogout} className="w-full glass-card border border-white/5 p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors group">
                        <div className="flex items-center gap-3"><span className="material-symbols-outlined text-on-surface-variant group-hover:text-white transition-colors">logout</span><span className="font-body-md text-on-surface">Log Out</span></div>
                        <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                      </button>
                      <button onClick={() => setDeleteView('request')} className="w-full glass-card border border-error/20 bg-error/5 p-4 rounded-xl flex items-center justify-between hover:bg-error/10 transition-colors group">
                        <div className="flex items-center gap-3"><span className="material-symbols-outlined text-error">delete_forever</span><span className="font-body-md text-error">Delete Account</span></div>
                        <span className="material-symbols-outlined text-error">chevron_right</span>
                      </button>
                    </div>
                  )}

                  {deleteView === 'request' && (
                    <div className="p-4 border border-error/50 bg-error/5 rounded-xl space-y-4">
                      <h3 className="text-error font-bold flex items-center gap-2"><span className="material-symbols-outlined">warning</span> Danger Zone</h3>
                      <p className="text-sm text-on-surface-variant">Deleting your account is permanent. All your habits and momentum will be lost forever.</p>
                      <div className="flex gap-3">
                        <button onClick={() => setDeleteView('none')} className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-on-surface text-sm">Cancel</button>
                        <button onClick={handleDeleteRequest} disabled={saving} className="flex-1 py-3 rounded-xl bg-error text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50 text-sm">{saving ? 'Sending Code...' : 'Send Deletion Code'}</button>
                      </div>
                    </div>
                  )}

                  {deleteView === 'verify' && (
                    <div className="p-4 border border-error/50 bg-error/5 rounded-xl space-y-4">
                      <h3 className="text-error font-bold">Confirm Deletion</h3>
                      <p className="text-sm text-on-surface-variant">Enter the 6-digit code we sent to your email.</p>
                      <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} className="w-full bg-black/20 border border-error/30 rounded-xl p-4 focus:ring-0 text-headline-lg tracking-[0.5em] text-center text-white placeholder:text-white/20" placeholder="••••••" required />
                      <div className="flex gap-3">
                        <button onClick={() => setDeleteView('none')} className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-on-surface text-sm">Cancel</button>
                        <button onClick={handleDeleteVerify} disabled={saving || otp.length < 6} className="flex-1 py-3 rounded-xl bg-error text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50 text-sm">{saving ? 'Deleting...' : 'Permanently Delete'}</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
