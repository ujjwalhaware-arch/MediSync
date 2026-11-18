import React, { useState } from 'react';
import { 
  Pill, 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  HeartHandshake, 
  ArrowRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('PATIENT'); // 'PATIENT' or 'CAREGIVER'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          phone: phone.trim(),
          preferred_language: language
        });
      } else {
        await login(email.trim(), password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoPass) => {
    setLoading(true);
    setError('');
    try {
      await login(demoEmail, demoPass);
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-cyan-50/30 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Logo & Title */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-white shadow-lg shadow-teal-500/30 mb-3">
          <Pill className="w-8 h-8 transform -rotate-45" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">MediSync</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Intelligent Medicine Reminder & Treatment Adherence Tracker
        </p>

        {/* Language selector pills */}
        <div className="mt-3 inline-flex items-center space-x-1 p-1 bg-white/80 rounded-xl border border-slate-200/80 shadow-xs text-xs font-semibold">
          {[
            { code: 'en', label: 'English' },
            { code: 'hi', label: 'हिन्दी' },
            { code: 'mr', label: 'मराठी' }
          ].map((l) => (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                language === l.code ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Auth Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-3xl shadow-xl border border-slate-200/80 space-y-6">
          {/* Role selector tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setRole('PATIENT')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                role === 'PATIENT' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Patient Portal
            </button>
            <button
              type="button"
              onClick={() => setRole('CAREGIVER')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                role === 'CAREGIVER' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Caregiver Portal
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@medisync.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone (Optional)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50 active:scale-95"
            >
              <span>{loading ? 'Processing...' : (isRegister ? 'Create Account' : 'Sign In')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Toggle Register / Login */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              {isRegister ? 'Already have an account? Sign In' : "Don't have an account yet? Register"}
            </button>
          </div>

          {/* 1-Click Demo Accounts */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block text-center">
              Quick 1-Click Demo Logins
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('patient@medisync.com', 'patient123')}
                disabled={loading}
                className="p-2.5 rounded-xl border border-teal-200/80 bg-teal-50/40 hover:bg-teal-50 text-left transition-colors"
              >
                <span className="text-[11px] font-bold text-teal-900 block truncate">Ramesh Sharma</span>
                <span className="text-[10px] text-teal-700 block">Patient • Active Doses</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('caregiver@medisync.com', 'caregiver123')}
                disabled={loading}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors"
              >
                <span className="text-[11px] font-bold text-slate-900 block truncate">Priya Sharma</span>
                <span className="text-[10px] text-slate-500 block">Caregiver • Linked Hub</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="mt-4 text-center text-[11px] text-slate-400 flex items-center justify-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Patient-first clinical data privacy & caregiver escalation</span>
        </p>
      </div>
    </div>
  );
}

