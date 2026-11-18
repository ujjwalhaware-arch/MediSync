import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Pill, 
  TrendingUp, 
  Calendar, 
  Mic, 
  ChevronRight, 
  Sparkles, 
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  Package,
  Camera
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Dashboard({ onOpenVoice, onOpenAddMed, onOpenScanRx, setCurrentTab }) {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [todayDoses, setTodayDoses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Skip dose prompt state
  const [skipModalDose, setSkipModalDose] = useState(null);
  const [skipReason, setSkipReason] = useState('');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [doses, stats, inv] = await Promise.all([
        api.getTodayDoses(),
        api.getAdherenceAnalytics(7),
        api.getInventory()
      ]);
      setTodayDoses(doses);
      setAnalytics(stats);
      setInventory(inv);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleStatusChange = async (doseId, status, reason = null) => {
    try {
      await api.updateDoseStatus(doseId, status, reason);
      await loadDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to update dose');
    }
  };

  const handleConfirmSkip = async () => {
    if (!skipModalDose) return;
    await handleStatusChange(skipModalDose.id, 'SKIPPED', skipReason || 'Skipped by patient');
    setSkipModalDose(null);
    setSkipReason('');
  };

  // Metrics
  const totalDosesToday = todayDoses.length;
  const takenDosesToday = todayDoses.filter(d => d.status === 'TAKEN').length;
  const missedDosesToday = todayDoses.filter(d => d.status === 'MISSED').length;
  const pendingDosesToday = todayDoses.filter(d => d.status === 'SCHEDULED');
  const todayProgress = totalDosesToday > 0 ? Math.round((takenDosesToday / totalDosesToday) * 100) : 100;
  const nextUpcoming = pendingDosesToday[0] || null;

  const lowStockItems = inventory.filter(i => i.is_low_stock);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Quick Voice Trigger */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-600 p-6 sm:p-8 text-white shadow-xl shadow-teal-700/10">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-teal-200" />
            <span>Smart Care Adherence Monitoring</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Keep up the healthy routine, {user?.name?.split(' ')[0]}!
          </h2>
          <p className="mt-2 text-sm text-teal-100 leading-relaxed">
            You have completed <span className="font-bold text-white">{takenDosesToday} of {totalDosesToday}</span> scheduled doses today. Your 7-day adherence rate is <span className="font-bold text-white">{analytics?.summary?.adherencePercentage ?? 100}%</span>.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenScanRx}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-md shadow-emerald-900/20 transition-all active:scale-95"
            >
              <Camera className="w-4 h-4" />
              <span>Scan Prescription (OCR)</span>
            </button>
            <button
              onClick={onOpenVoice}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white text-teal-800 text-xs font-bold shadow-md hover:bg-teal-50 transition-all active:scale-95"
            >
              <Mic className="w-4 h-4 text-teal-600" />
              <span>{t.actions.listenVoice}</span>
            </button>
            <button
              onClick={onOpenAddMed}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-800/60 hover:bg-teal-800 text-white text-xs font-semibold border border-white/20 transition-colors"
            >
              <span>+ {t.actions.addMedicine}</span>
            </button>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-white/10 to-transparent pointer-events-none rounded-r-3xl" />
        <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* Missed Dose Alert Notification Banner (if any missed) */}
      {missedDosesToday > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-3.5 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">Missed Dose Alert Detected</span>
              <span className="font-semibold px-2 py-0.5 rounded-full bg-rose-200/80 text-rose-900 text-[10px]">
                Caregiver Notified
              </span>
            </div>
            <p className="mt-1 text-rose-700 leading-relaxed">
              One or more scheduled doses remained unmarked past the grace period. 
              <strong className="ml-1">Medical Safety Rule: Do NOT take a double or extra dose.</strong> Resume your regular medication schedule.
            </p>
          </div>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today Adherence */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.stats.todayAdherence}</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-900">{todayProgress}%</span>
            <span className="text-xs text-slate-400 font-medium">{takenDosesToday}/{totalDosesToday} taken</span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-teal-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${todayProgress}%` }}
            />
          </div>
        </div>

        {/* 7-Day Adherence */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.stats.weeklyScore}</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-900">{analytics?.summary?.adherencePercentage ?? 100}%</span>
            <span className="text-xs font-semibold text-emerald-600">Goal: 85%+</span>
          </div>
          <p className="mt-3 text-xs text-slate-400 truncate">
            Frequently missed: <span className="font-medium text-slate-600">{analytics?.summary?.mostMissedSlot || 'None'}</span>
          </p>
        </div>

        {/* Doses Remaining */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t.stats.dosesRemaining}</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-900">{pendingDosesToday.length}</span>
            <span className="text-xs text-slate-400 font-medium">doses pending</span>
          </div>
          <p className="mt-3 text-xs text-slate-400 truncate">
            Next: <span className="font-medium text-slate-600">{nextUpcoming ? `${nextUpcoming.medicine_name} (${nextUpcoming.scheduled_time})` : 'All done today'}</span>
          </p>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Inventory Runway</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${lowStockItems.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-slate-900">{lowStockItems.length}</span>
            <span className="text-xs text-slate-400 font-medium">low stock items</span>
          </div>
          <p className="mt-3 text-xs text-slate-400 truncate">
            {lowStockItems.length > 0 ? (
              <span className="text-amber-600 font-semibold">{lowStockItems[0].medicine_name} needs refill</span>
            ) : (
              <span className="text-emerald-600 font-medium">All stocks healthy</span>
            )}
          </p>
        </div>
      </div>

      {/* Main Grid: Today's Schedule + Analytics Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Medication Schedule */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Today's Prescribed Doses</h3>
              <p className="text-xs text-slate-400">Mark doses as taken or skipped in real time</p>
            </div>
            <button
              onClick={() => setCurrentTab('reminders')}
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center space-x-1"
            >
              <span>{t.actions.viewAll}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading today's schedule...</div>
          ) : todayDoses.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-dashed border-slate-200 text-center">
              <Pill className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">No medicines scheduled for today</p>
              <button
                onClick={onOpenAddMed}
                className="mt-3 px-4 py-2 text-xs font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors"
              >
                + Add Your First Medicine
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {todayDoses.map((dose) => {
                const isTaken = dose.status === 'TAKEN';
                const isMissed = dose.status === 'MISSED';
                const isSkipped = dose.status === 'SKIPPED';
                const isScheduled = dose.status === 'SCHEDULED';

                return (
                  <div
                    key={dose.id}
                    className={`p-4 rounded-2xl border transition-all bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                      isTaken ? 'border-teal-200/60 bg-teal-50/20' : isMissed ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-start space-x-3.5 min-w-0">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-xs"
                        style={{ backgroundColor: dose.color_tag || '#0d9488' }}
                      >
                        <Pill className="w-5 h-5 transform -rotate-45" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-slate-900 truncate">{dose.medicine_name}</h4>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {dose.dosage}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                          <span className="flex items-center space-x-1 font-semibold text-teal-700">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{dose.scheduled_time}</span>
                          </span>
                          <span className="capitalize">{dose.food_instruction?.replace('_', ' ').toLowerCase()}</span>
                          {dose.current_stock !== undefined && (
                            <span className="text-slate-400">
                              Stock: {dose.current_stock} {dose.stock_unit || 'units'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons / Status indicator */}
                    <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                      {isTaken ? (
                        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-100/70 text-teal-800 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 text-teal-600" />
                          <span>{t.status.taken}</span>
                        </div>
                      ) : isMissed ? (
                        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>{t.status.missed}</span>
                        </div>
                      ) : isSkipped ? (
                        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">
                          <XCircle className="w-4 h-4 text-slate-400" />
                          <span>{t.status.skipped}</span>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setSkipModalDose(dose)}
                            className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                          >
                            {t.actions.markSkipped}
                          </button>
                          <button
                            onClick={() => handleStatusChange(dose.id, 'TAKEN')}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-all active:scale-95"
                          >
                            ✓ {t.actions.markTaken}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Adherence Trend & Quick Caregiver Link Info */}
        <div className="space-y-6">
          {/* Weekly Adherence Trend */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800">Weekly Adherence Trend</h3>
              <button
                onClick={() => setCurrentTab('analytics')}
                className="text-xs text-teal-600 hover:underline font-semibold"
              >
                Full Report
              </button>
            </div>

            <div className="h-44 w-full">
              {analytics?.dailyTrend ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.dailyTrend}>
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip 
                      formatter={(val) => [`${val}%`, 'Adherence']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="adherence" 
                      stroke="#0d9488" 
                      strokeWidth={2.5} 
                      dot={{ r: 3, fill: '#0d9488' }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading chart...</div>
              )}
            </div>
          </div>

          {/* Low Stock Watchlist */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800">Stock & Refill Tracker</h3>
              <button
                onClick={() => setCurrentTab('inventory')}
                className="text-xs text-teal-600 hover:underline font-semibold"
              >
                Manage
              </button>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                <ShieldCheck className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <span>All medicine stocks have plenty of runway.</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{item.medicine_name}</p>
                      <p className="text-[11px] text-amber-800">
                        Only {item.current_stock} {item.unit} left (~{item.estimated_days_left} days)
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentTab('inventory')}
                      className="px-2.5 py-1 text-[11px] font-bold text-amber-800 bg-white border border-amber-200 rounded-lg hover:bg-amber-100"
                    >
                      Refill
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skip Dose Dialog Modal */}
      {skipModalDose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-100 space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Skip Dose Reason</h3>
            <p className="text-xs text-slate-500">
              Why are you skipping {skipModalDose.medicine_name}? (This helps your doctor and caregiver monitor reasons)
            </p>
            <input
              type="text"
              placeholder="e.g. Doctor fasting advice, nausea, travelling"
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setSkipModalDose(null)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSkip}
                className="px-4 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg"
              >
                Confirm Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

