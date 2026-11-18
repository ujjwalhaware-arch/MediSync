import React, { useState, useEffect } from 'react';
import { 
  Pill, 
  Plus, 
  Clock, 
  Calendar, 
  Trash2, 
  Edit3, 
  Package, 
  Search, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import AddMedicineModal from '../components/AddMedicineModal';
import RefillModal from '../components/RefillModal';

export default function MedicinesPage({ onOpenAddMed }) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refillMed, setRefillMed] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadMedicines = async () => {
    try {
      setLoading(true);
      const data = await api.getMedicines();
      setMedicines(data);
    } catch (err) {
      console.error('Error fetching medicines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove ${name} from your active prescriptions?`)) {
      try {
        await api.deleteMedicine(id);
        await loadMedicines();
      } catch (err) {
        alert(err.message || 'Failed to delete medicine');
      }
    }
  };

  const filtered = medicines.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.dosage.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            My Prescribed Medicines
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage your doctor's prescriptions, schedules, and active dosages
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Medicine</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by medicine name or strength..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
        />
      </div>

      {/* Medicines Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Loading medicines...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-dashed border-slate-200 text-center">
          <Pill className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No prescriptions found</h3>
          <p className="text-xs text-slate-400 mt-1">Add your medicines to start receiving smart reminders.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl"
          >
            + Add Medicine
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((med) => {
            const stock = med.inventory?.current_stock ?? 0;
            const isLow = stock <= (med.inventory?.low_stock_threshold || 5);

            return (
              <div
                key={med.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs"
                        style={{ backgroundColor: med.color_tag || '#0d9488' }}
                      >
                        <Pill className="w-5 h-5 transform -rotate-45" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{med.name}</h3>
                        <span className="text-xs font-semibold text-slate-500">{med.dosage} • {med.form}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(med.id, med.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete prescription"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Food & Instruction */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 font-medium">Food Instruction:</span>
                      <span className="font-semibold text-slate-800 capitalize">
                        {med.food_instruction?.replace('_', ' ').toLowerCase()}
                      </span>
                    </div>

                    {med.instructions && (
                      <div className="p-2 rounded-lg bg-slate-50 text-[11px] text-slate-600 italic">
                        "{med.instructions}"
                      </div>
                    )}

                    {/* Prescribed Timings */}
                    <div className="mt-2">
                      <span className="text-[11px] text-slate-400 font-medium block mb-1">Scheduled Slots:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {med.schedules?.map((s) => (
                          <span
                            key={s.id}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 font-semibold text-[11px] border border-teal-200/50"
                          >
                            <Clock className="w-3 h-3 text-teal-600" />
                            <span>{s.time_slot} ({s.scheduled_time})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Stock Status & Refill Button */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-medium uppercase">Current Stock</span>
                    <span className={`font-bold ${isLow ? 'text-amber-600' : 'text-slate-800'}`}>
                      {stock} {med.inventory?.unit || 'tablets'} {isLow && '(Low!)'}
                    </span>
                  </div>

                  <button
                    onClick={() => setRefillMed(med)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
                  >
                    + Refill Stock
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AddMedicineModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onMedicineAdded={loadMedicines}
      />

      {refillMed && (
        <RefillModal
          isOpen={!!refillMed}
          onClose={() => setRefillMed(null)}
          medicine={refillMed}
          onRefilled={loadMedicines}
        />
      )}
    </div>
  );
}

