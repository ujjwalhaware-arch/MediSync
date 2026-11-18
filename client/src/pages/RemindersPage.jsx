import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Calendar, 
  ShieldAlert, 
  Pill,
  History,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function RemindersPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('TODAY'); // 'TODAY' or 'HISTORY'
  const [todayDoses, setTodayDoses] = useState([]);
  const [historyDoses, setHistoryDoses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Skip modal
  const [skipDose, setSkipDose] = useState(null);
  const [skipReason, setSkipReason] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [today, hist] = await Promise.all([
        api.getTodayDoses(),
        api.getDoseHistory()
      ]);
      setTodayDoses(today);
      setHistoryDoses(hist);
    } catch (err) {
      console.error('Error fetching dose data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (doseId, status, reason = null) => {
    try {
      await api.updateDoseStatus(doseId, status, reason);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to update dose');
    }
  };

  const handleConfirmSkip = async () => {
    if (!skipDose) return;
    await handleStatusChange(skipDose.id, 'SKIPPED', skipReason || 'Skipped by patient');
    setSkipDose(null);
    setSkipReason('');
  };

  // Group today's doses by time slot
  const slots = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'];
  const groupedBySlot = slots.reduce((acc, slot) => {
    acc[slot] = todayDoses.filter(d => d.time_slot === slot);
    return acc;
  }, {});

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Medication Reminders & Dose Tracker
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Intelligent dose tracking with automated missed-dose escalation
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center space-x-1 p-1 bg-slate-200/70 rounded-xl self-start sm:self-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('TODAY')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              activeTab === 'TODAY' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Today's Schedule
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              activeTab === 'HISTORY' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dose History Log
          </button>
        </div>
      </div>

      {/* Safety Banner */}
      <div className="p-3.5 bg-teal-50 border border-teal-200/60 rounded-2xl flex items-center space-x-3 text-xs text-teal-900">
        <ShieldAlert className="w-5 h-5 text-teal-600 shrink-0" />
        <div>
          <strong className="font-semibold">Clinical Guidance:</strong> Reminders fire at the exact prescribed time with a 15-minute follow-up. If unconfirmed after the grace period, your dose is marked Missed and your caregiver is alerted. Never double your dose.
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Loading doses...</div>
      ) : activeTab === 'TODAY' ? (
        /* TODAY'S DOSES BY TIME SLOTS */
        <div className="space-y-6">
          {slots.map((slot) => {
            const dosesInSlot = groupedBySlot[slot] || [];
            if (dosesInSlot.length === 0) return null;

            return (
              <div key={slot} className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                  <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">
                    {slot} ({dosesInSlot.length} {dosesInSlot.length === 1 ? 'dose' : 'doses'})
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dosesInSlot.map((dose) => {
                    const isTaken = dose.status === 'TAKEN';
                    const isMissed = dose.status === 'MISSED';
                    const isSkipped = dose.status === 'SKIPPED';
                    const isScheduled = dose.status === 'SCHEDULED';

                    return (
                      <div
                        key={dose.id}
                        className={`p-4 rounded-2xl border transition-all bg-white flex items-center justify-between shadow-xs ${
                          isTaken ? 'border-teal-200/60 bg-teal-50/20' : isMissed ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200/80'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs"
                            style={{ backgroundColor: dose.color_tag || '#0d9488' }}
                          >
                            <Pill className="w-5 h-5 transform -rotate-45" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm truncate">{dose.medicine_name}</h4>
                            <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                              <span className="font-semibold text-teal-700 flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{dose.scheduled_time}</span>
                              </span>
                              <span>•</span>
                              <span>{dose.dosage}</span>
                              <span>•</span>
                              <span className="capitalize">{dose.food_instruction?.replace('_', ' ').toLowerCase()}</span>
                            </div>
                            {isTaken && dose.taken_at && (
                              <span className="text-[10px] text-teal-600 block mt-1">
                                Recorded at {new Date(dose.taken_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status & Actions */}
                        <div className="flex items-center space-x-2 shrink-0">
                          {isTaken ? (
                            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-100 text-teal-800 text-xs font-bold">
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
                                onClick={() => setSkipDose(dose)}
                                className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-900 rounded-lg font-medium"
                              >
                                Skip
                              </button>
                              <button
                                onClick={() => handleStatusChange(dose.id, 'TAKEN')}
                                className="px-3.5 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs"
                              >
                                ✓ Take
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* HISTORICAL LOG TABLE */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
              <History className="w-4 h-4 text-slate-400" />
              <span>Past Medication Activity Records</span>
            </h3>
            <span className="text-xs text-slate-400">{historyDoses.length} records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Medicine</th>
                  <th className="py-3 px-4">Dosage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notes / Reason</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyDoses.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400">
                      No historical records available yet.
                    </td>
                  </tr>
                ) : (
                  historyDoses.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {row.dose_date} • {row.scheduled_time}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{row.medicine_name}</td>
                      <td className="py-3 px-4 text-slate-500">{row.dosage}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.status === 'TAKEN' ? 'bg-teal-50 text-teal-700' :
                          row.status === 'MISSED' ? 'bg-rose-50 text-rose-700' :
                          row.status === 'SKIPPED' ? 'bg-slate-100 text-slate-600' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 truncate max-w-xs">
                        {row.skipped_reason || (row.status === 'TAKEN' && row.taken_at ? `Confirmed at ${new Date(row.taken_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '-')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {row.status !== 'TAKEN' && (
                          <button
                            onClick={() => handleStatusChange(row.id, 'TAKEN')}
                            className="text-teal-600 hover:text-teal-700 font-semibold text-[11px]"
                          >
                            Mark Taken
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Skip Dose Dialog */}
      {skipDose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-100 space-y-3">
            <h3 className="text-sm font-bold text-slate-800">Skip Dose</h3>
            <p className="text-xs text-slate-500">
              Why are you skipping {skipDose.medicine_name}?
            </p>
            <input
              type="text"
              placeholder="e.g. Doctor recommendation, nausea"
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setSkipDose(null)}
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

