import React, { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  UserPlus, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Phone, 
  ChevronRight, 
  ShieldAlert, 
  TrendingUp, 
  Package, 
  X,
  FileText
} from 'lucide-react';
import { api } from '../services/api';

export default function CaregiverDashboard({ onSelectPatient }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Link Patient Modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');
  const [linking, setLinking] = useState(false);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await api.getCaregiverPatients();
      setPatients(data);
    } catch (err) {
      console.error('Error fetching caregiver patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleLinkPatient = async (e) => {
    e.preventDefault();
    if (!pairingCode.trim()) return;

    setLinking(true);
    setLinkError('');
    setLinkSuccess('');

    try {
      const res = await api.linkPatient(pairingCode.trim());
      setLinkSuccess(res.message || 'Patient successfully linked!');
      setPairingCode('');
      await loadPatients();
      setTimeout(() => {
        setShowLinkModal(false);
        setLinkSuccess('');
      }, 1500);
    } catch (err) {
      setLinkError(err.message || 'Invalid or expired pairing code.');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (patientId, name) => {
    if (window.confirm(`Are you sure you want to stop monitoring ${name}?`)) {
      try {
        await api.unlinkPatient(patientId);
        await loadPatients();
      } catch (err) {
        alert(err.message || 'Failed to remove relationship');
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Caregiver Monitoring Hub
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              {patients.length} {patients.length === 1 ? 'Patient' : 'Patients'} Linked
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time adherence oversight, missed-dose escalation alerts, and stock monitoring
          </p>
        </div>

        <button
          onClick={() => setShowLinkModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Link New Patient</span>
        </button>
      </div>

      {/* Patient Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Loading linked patients...</div>
      ) : patients.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center max-w-xl mx-auto">
          <HeartHandshake className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Patients Linked Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Ask your family member or patient for their 6-character MediSync Pairing Code (e.g. <strong className="text-teal-700">SM-7894</strong>) to begin monitoring.
          </p>
          <button
            onClick={() => setShowLinkModal(true)}
            className="mt-4 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl"
          >
            Enter Pairing Code
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {patients.map((p) => {
            const today = p.todayStats || {};
            const hasMissed = today.missed > 0;
            const hasLowStock = p.lowStockCount > 0;

            return (
              <div
                key={p.patient_id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-5"
              >
                <div>
                  {/* Card Top: Patient info + Phone shortcut */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-white font-extrabold text-base flex items-center justify-center shadow-md shadow-teal-500/20">
                        {p.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">{p.name}</h3>
                        <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                          <span>{p.email}</span>
                          {p.blood_group && (
                            <>
                              <span>•</span>
                              <span className="font-bold text-slate-600">{p.blood_group}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {p.phone && (
                      <a
                        href={`tel:${p.phone}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                        title="Call patient"
                      >
                        <Phone className="w-3.5 h-3.5 text-teal-600" />
                        <span>Call</span>
                      </a>
                    )}
                  </div>

                  {/* Urgent Alert Banner (if missed or low stock) */}
                  {(hasMissed || hasLowStock) && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                      {hasMissed && (
                        <div className="flex items-center space-x-2 font-bold">
                          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{today.missed} Missed Dose(s) Today! Follow-up advised.</span>
                        </div>
                      )}
                      {hasLowStock && (
                        <div className="flex items-center space-x-2 font-medium text-amber-800">
                          <Package className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>{p.lowStockCount} medicine(s) running low on inventory.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Today's Medication Progress Bar */}
                  <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-semibold text-slate-700">Today's Doses Progress</span>
                      <span className="font-extrabold text-slate-900">{today.taken} of {today.total} taken ({today.progress}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-teal-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${today.progress}%` }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="text-teal-700 font-semibold">{today.taken} Confirmed</span>
                      <span className="text-amber-700 font-semibold">{today.pending} Remaining</span>
                      <span className="text-rose-700 font-semibold">{today.missed} Missed</span>
                    </div>
                  </div>

                  {/* Adherence Score & Low stock snippet */}
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200/50">
                      <span className="text-[10px] uppercase font-bold text-teal-800 block">7-Day Adherence</span>
                      <span className="text-xl font-extrabold text-teal-700">{p.weeklyAdherence}%</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Emergency Contact</span>
                      <span className="font-bold text-slate-800 truncate block">
                        {p.emergency_contact_name || 'Not configured'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card CTA */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleUnlink(p.patient_id, p.name)}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    Unlink
                  </button>

                  <button
                    onClick={() => onSelectPatient && onSelectPatient(p.patient_id)}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all"
                  >
                    <span>View Patient Records</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Link Patient Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Link Patient</h3>
                  <p className="text-xs text-slate-400">Enter pairing authorization code</p>
                </div>
              </div>
              <button onClick={() => setShowLinkModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLinkPatient} className="p-6 space-y-4">
              {linkError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{linkError}</span>
                </div>
              )}
              {linkSuccess && (
                <div className="p-3 rounded-xl bg-teal-50 text-teal-800 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{linkSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Patient 6-Character Pairing Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g. SM-7894"
                  value={pairingCode}
                  onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                  required
                  maxLength={10}
                  className="w-full px-4 py-2.5 text-base tracking-widest font-mono text-center uppercase rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-bold"
                />
                <p className="text-[11px] text-slate-400 mt-2 text-center">
                  Demo Patient Code: <span className="font-bold text-teal-700 font-mono">SM-7894</span>
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linking || !pairingCode.trim()}
                  className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {linking ? 'Authorizing...' : 'Authorize & Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

