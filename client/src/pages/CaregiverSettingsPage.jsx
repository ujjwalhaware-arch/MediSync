import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Copy, 
  Check, 
  RotateCw, 
  UserCheck, 
  UserX, 
  AlertCircle, 
  HeartHandshake 
} from 'lucide-react';
import { api } from '../services/api';

export default function CaregiverSettingsPage() {
  const [data, setData] = useState({ pairingCode: null, caregivers: [] });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getMyCaregivers();
      setData(res);
    } catch (err) {
      console.error('Error fetching caregiver settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyCode = () => {
    if (!data.pairingCode) return;
    navigator.clipboard.writeText(data.pairingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateCode = async () => {
    try {
      setGenerating(true);
      const res = await api.generatePairingCode();
      setData(prev => ({ ...prev, pairingCode: res.pairingCode }));
    } catch (err) {
      alert(err.message || 'Failed to generate pairing code');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (caregiverId, name) => {
    if (window.confirm(`Revoke medication access for ${name}?`)) {
      try {
        await api.unlinkPatient(caregiverId);
        await loadData();
      } catch (err) {
        alert(err.message || 'Failed to revoke access');
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Caregiver Access & Pairing
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Authorize trusted family members or caregivers to monitor your medication compliance
        </p>
      </div>

      {/* Pairing Code Generator Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Your Secure Pairing Code</h3>
            <p className="text-xs text-slate-400">Share this code with your caregiver to connect their dashboard</p>
          </div>
        </div>

        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Active Authorization Code
            </span>
            <span className="text-3xl font-black text-slate-900 tracking-widest font-mono">
              {data.pairingCode || 'NO CODE'}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Valid for linking authorized caregiver accounts</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyCode}
              disabled={!data.pairingCode}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-white text-slate-800 text-xs font-bold border border-slate-200 shadow-xs hover:bg-slate-50 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleGenerateCode}
              disabled={generating}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <RotateCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
              <span>{data.pairingCode ? 'Regenerate' : 'Generate Code'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Linked Caregivers List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
        <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Authorized Linked Caregivers ({data.caregivers?.length || 0})</span>
        </h3>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading caregivers...</div>
        ) : data.caregivers?.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No caregivers have linked to your account yet. Share the code above to connect.
          </div>
        ) : (
          <div className="space-y-3">
            {data.caregivers.map((cg) => (
              <div
                key={cg.caregiver_id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm">
                    {cg.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{cg.name}</h4>
                    <p className="text-xs text-slate-400">{cg.email} • {cg.phone || 'No phone'}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleRevoke(cg.caregiver_id, cg.name)}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  Revoke Access
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

