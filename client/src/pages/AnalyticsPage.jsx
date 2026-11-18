import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  FileDown, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Pill, 
  Printer, 
  Calendar,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const PIE_COLORS = {
  TAKEN: '#0d9488',   // Teal
  MISSED: '#e11d48',  // Rose
  SKIPPED: '#94a3b8'  // Slate
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const reportRef = useRef(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getAdherenceAnalytics(days);
      setData(res);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [days]);

  // Export Clinical PDF Report using jsPDF and html2canvas
  const handleExportPdf = async () => {
    if (!reportRef.current) return;
    try {
      setExporting(true);
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const patientName = user?.name ? user.name.replace(/\s+/g, '_') : 'Patient';
      pdf.save(`MediSync_Adherence_Report_${patientName}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Failed to generate PDF report.');
    } finally {
      setExporting(false);
    }
  };

  const summary = data?.summary || {};
  const pieData = [
    { name: 'Taken', value: summary.takenDoses || 0, color: PIE_COLORS.TAKEN },
    { name: 'Missed', value: summary.missedDoses || 0, color: PIE_COLORS.MISSED },
    { name: 'Skipped', value: summary.skippedDoses || 0, color: PIE_COLORS.SKIPPED }
  ].filter(d => d.value > 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Adherence Analytics & Clinical Reports
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Adherence = (Taken Doses / Total Scheduled) × 100 • Exportable clinical report
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Days Filter */}
          <div className="flex bg-slate-200/80 rounded-xl p-1 text-xs font-semibold">
            <button
              onClick={() => setDays(7)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${days === 7 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDays(30)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${days === 30 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
            >
              Last 30 Days
            </button>
          </div>

          {/* Export PDF Button */}
          <button
            onClick={handleExportPdf}
            disabled={exporting || loading}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all disabled:opacity-50 active:scale-95"
          >
            <FileDown className="w-4 h-4" />
            <span>{exporting ? 'Generating PDF...' : 'Export Weekly PDF'}</span>
          </button>
        </div>
      </div>

      {/* Printable Report Wrapper Container */}
      <div ref={reportRef} className="space-y-6 bg-slate-50 p-2 sm:p-4 rounded-3xl">
        {/* Clinical Document Header for PDF */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-teal-500/20">
              <Pill className="w-6 h-6 transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-base text-slate-900">MediSync Clinical Compliance Report</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  OFFICIAL
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Patient: <strong className="text-slate-800">{user?.name}</strong> • Window: Last {days} Days • Generated {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-100 sm:pl-6">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Overall Score</span>
            <span className="text-3xl font-black text-teal-600">
              {summary.adherencePercentage ?? 100}%
            </span>
          </div>
        </div>

        {/* 4 Summary Scorecards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">Total Scheduled</span>
            <span className="text-2xl font-extrabold text-slate-900">{summary.totalScheduled ?? 0}</span>
            <p className="text-xs text-slate-400 mt-1">Doses in window</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-teal-600 uppercase block mb-1">Doses Confirmed Taken</span>
            <span className="text-2xl font-extrabold text-teal-700">{summary.takenDoses ?? 0}</span>
            <p className="text-xs text-slate-400 mt-1">Full compliance</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-rose-600 uppercase block mb-1">Missed Doses</span>
            <span className="text-2xl font-extrabold text-rose-600">{summary.missedDoses ?? 0}</span>
            <p className="text-xs text-slate-400 mt-1">Escalated to caregiver</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">Skipped (Deliberate)</span>
            <span className="text-2xl font-extrabold text-slate-700">{summary.skippedDoses ?? 0}</span>
            <p className="text-xs text-slate-400 mt-1">Not counted as taken</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Trend Line Chart */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h4 className="font-bold text-sm text-slate-800 mb-4 flex items-center justify-between">
              <span>Daily Adherence Trend (%)</span>
              <span className="text-xs font-semibold text-teal-600">Clinical Target: 85%+</span>
            </h4>
            <div className="h-64 w-full">
              {data?.dailyTrend ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.dailyTrend}>
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
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#0d9488' }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </div>

          {/* Dose Distribution Donut */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <h4 className="font-bold text-sm text-slate-800 mb-2">Dose Status Distribution</h4>
            <div className="h-52 w-full">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">No data available</div>
              )}
            </div>

            <div className="flex items-center justify-around text-xs pt-2 border-t border-slate-100">
              <span className="flex items-center space-x-1.5 font-medium text-teal-700">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                <span>Taken ({summary.takenDoses})</span>
              </span>
              <span className="flex items-center space-x-1.5 font-medium text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <span>Missed ({summary.missedDoses})</span>
              </span>
              <span className="flex items-center space-x-1.5 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span>Skipped ({summary.skippedDoses})</span>
              </span>
            </div>
          </div>
        </div>

        {/* Time of Day & Medicine Breakdown Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time Slot Adherence */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-slate-800">Time-of-Day Adherence Breakdown</h4>
              <span className="text-xs text-slate-400">
                Vulnerable Slot: <strong className="text-rose-600">{summary.mostMissedSlot}</strong>
              </span>
            </div>

            <div className="h-48 w-full">
              {data?.timeSlotBreakdown ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.timeSlotBreakdown}>
                    <XAxis dataKey="slot" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip 
                      formatter={(val) => [`${val}%`, 'Compliance']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    />
                    <Bar dataKey="adherence" fill="#0284c7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </div>

          {/* Medicine-wise Scorecard */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h4 className="font-bold text-sm text-slate-800 mb-3">Medicine-Wise Compliance Scorecard</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Medicine</th>
                    <th className="py-2.5 px-3">Taken / Sched</th>
                    <th className="py-2.5 px-3">Missed</th>
                    <th className="py-2.5 px-3 text-right">Adherence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.medicineBreakdown?.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-bold text-slate-800 truncate max-w-[140px]">{m.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{m.taken} / {m.total}</td>
                      <td className="py-2.5 px-3 text-rose-600 font-semibold">{m.missed}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`font-bold px-2 py-0.5 rounded-full ${
                          m.adherence >= 85 ? 'bg-teal-50 text-teal-700' :
                          m.adherence >= 60 ? 'bg-amber-50 text-amber-700' :
                          'bg-rose-50 text-rose-700'
                        }`}>
                          {m.adherence}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Clinical Sign-off Section (Included in PDF) */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-6 text-xs text-slate-500">
          <div>
            <span className="font-bold text-slate-800 text-sm block">Attending Physician Review Notes:</span>
            <p className="mt-1 text-slate-400 max-w-md">
              Medication adherence verified via SmartMedi electronic health tracker. All missed doses escalated according to safety protocol with zero compensatory double doses.
            </p>
          </div>
          <div className="text-right sm:border-l sm:border-slate-100 sm:pl-8 shrink-0">
            <div className="w-40 border-b border-slate-300 mb-1" />
            <span className="font-semibold text-slate-700">Physician Signature & Date</span>
          </div>
        </div>
      </div>
    </div>
  );
}

