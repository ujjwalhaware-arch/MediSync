import React, { useState } from 'react';
import { X, PackagePlus, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function RefillModal({ isOpen, onClose, medicine, onRefilled }) {
  const [addedQuantity, setAddedQuantity] = useState('30');
  const [newTotalStock, setNewTotalStock] = useState('');
  const [mode, setMode] = useState('ADD'); // 'ADD' or 'SET'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !medicine) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = mode === 'ADD' 
        ? { addedQuantity: Number(addedQuantity) }
        : { newTotalStock: Number(newTotalStock) };

      await api.refillStock(medicine.id || medicine.medicine_id, payload);
      onRefilled();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Refill Medicine Stock</h2>
              <p className="text-xs text-slate-400">{medicine.name || medicine.medicine_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-500">Current Stock Remaining:</span>
            <span className="font-bold text-slate-800 text-sm">
              {medicine.current_stock ?? 0} {medicine.unit || 'units'}
            </span>
          </div>

          <div className="flex items-center space-x-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode('ADD')}
              className={`flex-1 py-1.5 rounded-lg transition-colors ${mode === 'ADD' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              + Add Purchased Quantity
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('SET');
                setNewTotalStock(String(medicine.current_stock || 0));
              }}
              className={`flex-1 py-1.5 rounded-lg transition-colors ${mode === 'SET' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Exact Total Count
            </button>
          </div>

          {mode === 'ADD' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity Added (e.g. new strip of 10 or 30 tablets)
              </label>
              <input
                type="number"
                min="1"
                value={addedQuantity}
                onChange={(e) => setAddedQuantity(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Exact Total Stock
              </label>
              <input
                type="number"
                min="0"
                value={newTotalStock}
                onChange={(e) => setNewTotalStock(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

