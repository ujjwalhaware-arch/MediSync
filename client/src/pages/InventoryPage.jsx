import React, { useState, useEffect } from 'react';
import { 
  Package, 
  PackagePlus, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  TrendingDown, 
  Pill,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import RefillModal from '../components/RefillModal';

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMed, setSelectedMed] = useState(null);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await api.getInventory();
      setInventory(data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const lowStockCount = inventory.filter(i => i.is_low_stock).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Medicine Stock & Predictive Refill Tracker
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Intelligent inventory prediction based purely on confirmed taken doses
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {lowStockCount > 0 ? (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>{lowStockCount} medicines need refill</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>All supplies healthy</span>
            </div>
          )}
        </div>
      </div>

      {/* Logic Notice Banner */}
      <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200/80 text-xs text-slate-600 flex items-start space-x-3">
        <Package className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-slate-800">Automated Refill Prediction Engine:</strong> Daily consumption is calculated from your active prescription schedules. Units are deducted <strong className="text-teal-700">only when you confirm a dose as Taken</strong>. Missed or skipped doses never deduct stock.
        </div>
      </div>

      {/* Inventory Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">Loading inventory forecasts...</div>
      ) : inventory.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-dashed border-slate-200 text-center">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No inventory tracked yet</h3>
          <p className="text-xs text-slate-400 mt-1">Add your medicines to enable stock and refill calculations.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {inventory.map((item) => {
            const daysLeft = item.estimated_days_left;
            const isCritical = daysLeft !== null && daysLeft <= 3;
            const isLow = item.is_low_stock;

            // Runway bar width calculation (relative to 30 days maximum for visuals)
            const runwayPercent = daysLeft !== null ? Math.min(100, Math.round((daysLeft / 30) * 100)) : 100;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-shadow hover:shadow-md ${
                  isCritical 
                    ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/10' 
                    : isLow 
                    ? 'border-amber-300 ring-1 ring-amber-200' 
                    : 'border-slate-200/80'
                }`}
              >
                <div>
                  {/* Card Top */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs"
                        style={{ backgroundColor: item.color_tag || '#0d9488' }}
                      >
                        <Pill className="w-5 h-5 transform -rotate-45" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{item.medicine_name}</h3>
                        <span className="text-xs text-slate-500 font-medium">{item.dosage}</span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      isCritical ? 'bg-rose-100 text-rose-800' :
                      isLow ? 'bg-amber-100 text-amber-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isCritical ? 'Critical' : isLow ? 'Low Stock' : 'Adequate'}
                    </span>
                  </div>

                  {/* Stock Metrics */}
                  <div className="mt-4 grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Current Stock</span>
                      <span className="text-base font-extrabold text-slate-800">
                        {item.current_stock} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">Daily Consumption</span>
                      <span className="text-base font-extrabold text-slate-800">
                        {item.daily_consumption} <span className="text-xs font-normal text-slate-500">{item.unit}/day</span>
                      </span>
                    </div>
                  </div>

                  {/* Estimated Days & Refill Date */}
                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Supply Runway:</span>
                      </span>
                      <span className={`font-bold ${isCritical ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-800'}`}>
                        {daysLeft !== null ? `~${daysLeft} days remaining` : 'No scheduled doses'}
                      </span>
                    </div>

                    {/* Visual Runway Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isCritical ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-teal-500'
                        }`}
                        style={{ width: `${runwayPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-500 font-medium flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Expected Refill Date:</span>
                      </span>
                      <span className="font-semibold text-slate-800">
                        {item.expected_refill_date || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card CTA: Refill Modal */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    Threshold: &lt; {item.low_stock_threshold} {item.unit}
                  </span>
                  <button
                    onClick={() => setSelectedMed(item)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-xs transition-colors"
                  >
                    <PackagePlus className="w-3.5 h-3.5" />
                    <span>Update Stock</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Refill Stock Modal */}
      {selectedMed && (
        <RefillModal
          isOpen={!!selectedMed}
          onClose={() => setSelectedMed(null)}
          medicine={selectedMed}
          onRefilled={loadInventory}
        />
      )}
    </div>
  );
}

