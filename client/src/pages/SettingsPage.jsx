import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Phone, 
  Heart, 
  ShieldAlert, 
  Volume2, 
  Bell, 
  Clock, 
  Save, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const { permission, requestNotificationPermission, showSystemNotification } = useNotifications();
  const { language, setLanguage, t } = useLanguage();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [emergencyContactName, setEmergencyContactName] = useState(user?.profile?.emergency_contact_name || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(user?.profile?.emergency_contact_phone || '');
  const [bloodGroup, setBloodGroup] = useState(user?.profile?.blood_group || '');
  const [allergies, setAllergies] = useState(user?.profile?.allergies || '');
  const [notes, setNotes] = useState(user?.profile?.notes || '');

  // Reminder & Escalation preferences
  const [followUpInterval, setFollowUpInterval] = useState('15');
  const [gracePeriod, setGracePeriod] = useState('45');

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadLatestProfile() {
      try {
        const res = await api.getMe();
        if (res.user) {
          setName(res.user.name || '');
          setPhone(res.user.phone || '');
          if (res.user.profile) {
            setEmergencyContactName(res.user.profile.emergency_contact_name || '');
            setEmergencyContactPhone(res.user.profile.emergency_contact_phone || '');
            setBloodGroup(res.user.profile.blood_group || '');
            setAllergies(res.user.profile.allergies || '');
            setNotes(res.user.profile.notes || '');
          }
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
    loadLatestProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSavedSuccess(false);

    try {
      await api.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
        bloodGroup: bloodGroup.trim(),
        allergies: allergies.trim(),
        notes: notes.trim(),
        followUpIntervalMinutes: Number(followUpInterval),
        gracePeriodMinutes: Number(gracePeriod)
      });

      const updated = await api.getMe();
      setUser(updated.user);

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = () => {
    showSystemNotification('MediSync Alert Test', {
      body: 'This is a test notification. Your reminder alerts are operating correctly.'
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Application & Profile Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Configure personal health profiles, escalation grace periods, and alert settings
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {savedSuccess && (
          <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Settings and clinical profile successfully updated!</span>
          </div>
        )}

        {/* 1. Personal & Clinical Profile */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
            <User className="w-4 h-4 text-teal-600" />
            <span>Patient Identification & Health Records</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Drug Allergies</label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g. Penicillin, Sulfa drugs, None"
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Chronic Diagnosis & Physician Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Type-2 Diabetes & Stage 1 Hypertension"
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
        </div>

        {/* 2. Emergency Contact Information */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
            <Heart className="w-4 h-4 text-rose-500" />
            <span>Emergency Contact & Family Caregiver</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Name</label>
              <input
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="e.g. Priya Sharma (Daughter)"
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Phone</label>
              <input
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="+91 98123 45678"
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* 3. Reminder Intervals & Escalation Grace Period */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <span>Intelligent Escalation & Grace Period Windows</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Follow-Up Reminder Interval</label>
              <select
                value={followUpInterval}
                onChange={(e) => setFollowUpInterval(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
              >
                <option value="10">10 Minutes after due time</option>
                <option value="15">15 Minutes after due time (Recommended)</option>
                <option value="20">20 Minutes after due time</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">When to send a second gentle reminder if still unconfirmed.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Grace Period to Missed Escalation</label>
              <select
                value={gracePeriod}
                onChange={(e) => setGracePeriod(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
              >
                <option value="30">30 Minutes (Strict)</option>
                <option value="45">45 Minutes (Standard Clinical)</option>
                <option value="60">60 Minutes (Flexible)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Dose is marked Missed and linked caregivers are alerted.</p>
            </div>
          </div>
        </div>

        {/* 4. Audio Chime & Browser Notification Testing */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-teal-600" />
            <span>Audio & Notification Verification</span>
          </h3>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-800">Browser Web Notifications:</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  permission === 'granted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {permission}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ensure alerts fire reliably even when the tab is in the background.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {permission !== 'granted' && (
                <button
                  type="button"
                  onClick={requestNotificationPermission}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors"
                >
                  Enable Permissions
                </button>
              )}
              <button
                type="button"
                onClick={handleTestNotification}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors shadow-xs"
              >
                Test Sound & Alert
              </button>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all disabled:opacity-50 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
