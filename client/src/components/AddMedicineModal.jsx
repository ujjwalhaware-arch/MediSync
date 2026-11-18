import React, { useState } from 'react';
import { X, Plus, Trash2, Clock, Calendar, Pill, ShieldAlert, Camera, Sparkles } from 'lucide-react';
import { api } from '../services/api';

const DEFAULT_SLOTS = [
  { time_slot: 'MORNING', scheduled_time: '08:30', label: 'Morning (08:30 AM)' },
  { time_slot: 'AFTERNOON', scheduled_time: '13:30', label: 'Afternoon (01:30 PM)' },
  { time_slot: 'EVENING', scheduled_time: '18:30', label: 'Evening (06:30 PM)' },
  { time_slot: 'NIGHT', scheduled_time: '21:30', label: 'Night (09:30 PM)' }
];

export default function AddMedicineModal({ isOpen, onClose, onMedicineAdded, onOpenScan }) {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('1 tablet');
  const [form, setForm] = useState('TABLET');
  const [foodInstruction, setFoodInstruction] = useState('AFTER_FOOD');
  const [instructions, setInstructions] = useState('');
  const [colorTag, setColorTag] = useState('#0d9488');
  const [isChronic, setIsChronic] = useState(true);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [initialStock, setInitialStock] = useState('30');
  const [unit, setUnit] = useState('tablets');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');

  // Schedules state: which slots are selected
  const [selectedSlots, setSelectedSlots] = useState(['MORNING']);
  const [customTimes, setCustomTimes] = useState({
    MORNING: '08:30',
    AFTERNOON: '13:30',
    EVENING: '18:30',
    NIGHT: '21:30'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleSlot = (slot) => {
    if (selectedSlots.includes(slot)) {
      if (selectedSlots.length === 1) return; // Keep at least one
      setSelectedSlots(selectedSlots.filter(s => s !== slot));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter medicine name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const schedules = selectedSlots.map(slot => ({
        time_slot: slot,
        scheduled_time: customTimes[slot],
        dosage_quantity: 1.0,
        recurrence_type: 'DAILY'
      }));

      await api.addMedicine({
        name: name.trim(),
        dosage: dosage.trim(),
        form,
        food_instruction: foodInstruction,
        color_tag: colorTag,
        instructions: instructions.trim() || null,
        start_date: startDate,
        end_date: isChronic ? null : (endDate || null),
        is_chronic: isChronic,
        schedules,
        initial_stock: Number(initialStock) || 0,
        unit,
        low_stock_threshold: Number(lowStockThreshold) || 5
      });

      onMedicineAdded();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add medicine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Add New Prescription</h2>
              <p className="text-xs text-slate-400">Configure schedule, dosage, and stock</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Quick OCR Banner */}
          {onOpenScan && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-teal-950">Have a Doctor's Prescription?</h4>
                  <p className="text-[11px] text-teal-700">Scan photo with OCR to auto-fill details & schedules</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenScan();
                }}
                className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs whitespace-nowrap active:scale-95 transition-all"
              >
                Scan Rx Photo
              </button>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Medicine Name & Dosage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Medicine Name *</label>
              <input
                type="text"
                placeholder="e.g. Metformin, Amlodipine"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dosage / Strength *</label>
              <input
                type="text"
                placeholder="e.g. 500 mg, 1 tablet, 10 ml"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Form & Food Instruction */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Medicine Form</label>
              <select
                value={form}
                onChange={(e) => setForm(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
              >
                <option value="TABLET">Tablet</option>
                <option value="CAPSULE">Capsule</option>
                <option value="SYRUP">Syrup / Liquid</option>
                <option value="INJECTION">Injection</option>
                <option value="DROPS">Drops</option>
                <option value="INHALER">Inhaler</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Food Relation</label>
              <select
                value={foodInstruction}
                onChange={(e) => setFoodInstruction(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
              >
                <option value="AFTER_FOOD">After Food (खाने के बाद)</option>
                <option value="BEFORE_FOOD">Before Food (खाने से पहले)</option>
                <option value="WITH_FOOD">With Food (भोजन के साथ)</option>
                <option value="EMPTY_STOMACH">Empty Stomach (खाली पेट)</option>
                <option value="NO_RESTRICTION">No Specific Restriction</option>
              </select>
            </div>
          </div>

          {/* Intake Schedule Timings */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Prescribed Daily Timings *</span>
              <span className="text-[11px] text-teal-600 font-normal">Select active slots</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DEFAULT_SLOTS.map((slot) => {
                const isSelected = selectedSlots.includes(slot.time_slot);
                return (
                  <div
                    key={slot.time_slot}
                    className={`p-2.5 rounded-xl border transition-all ${
                      isSelected 
                        ? 'bg-teal-50/60 border-teal-300 ring-1 ring-teal-400/30' 
                        : 'bg-white border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="flex items-center space-x-2 text-xs font-semibold text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSlot(slot.time_slot)}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                        <span>{slot.time_slot}</span>
                      </label>
                    </div>
                    {isSelected && (
                      <input
                        type="time"
                        value={customTimes[slot.time_slot]}
                        onChange={(e) => setCustomTimes({ ...customTimes, [slot.time_slot]: e.target.value })}
                        className="w-full px-2 py-1 text-xs font-medium rounded-lg border border-teal-200 bg-white focus:outline-none focus:border-teal-500"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inventory & Initial Stock */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <span>Stock & Refill Tracker</span>
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Purchased Stock</label>
                <input
                  type="number"
                  min="0"
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Unit</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="tablets/ml"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">Low Alert At</label>
                <input
                  type="number"
                  min="1"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Instructions Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Special Physician Notes</label>
            <input
              type="text"
              placeholder="e.g. Drink full glass of warm water, take after breakfast"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          {/* Color tag selector */}
          <div className="flex items-center space-x-3 pt-1">
            <span className="text-xs font-semibold text-slate-700">Card Color Tag:</span>
            <div className="flex items-center space-x-2">
              {['#0d9488', '#0284c7', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColorTag(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${colorTag === c ? 'scale-125 border-slate-800' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

