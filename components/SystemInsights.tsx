
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Patient } from '../types';

interface Props {
  patients: Patient[];
  onResetRegistry?: () => void;
}

export const SystemInsights: React.FC<Props> = ({ patients, onResetRegistry }) => {
  // Calculate status-based metrics
  const active = patients.filter(p => p.status === 'Active').length;
  const observation = patients.filter(p => p.status === 'Observation').length;
  const improved = patients.filter(p => p.status === 'Discharged - Improved').length;
  const notImproved = patients.filter(p => p.status === 'Discharged - Not Improved').length;
  
  // Calculate visit-based metrics for additional insights
  const totalVisits = patients.reduce((sum, p) => sum + (p.visits?.length || 0), 0);
  const patientsWithVisits = patients.filter(p => (p.visits?.length || 0) > 0).length;
  const avgVisitsPerPatient = patients.length > 0 ? (totalVisits / patients.length).toFixed(1) : '0';
  
  const totalDischarged = improved + notImproved;
  const successRate = totalDischarged > 0 ? Math.round((improved / totalDischarged) * 100) : 0;

  const stats = [
    { label: 'Total Cases', value: patients.length },
    { label: 'Active Registry', value: active + observation },
    { label: 'Success Outcomes', value: improved },
    { label: 'System Success', value: `${successRate}%` },
    { label: 'Total Visits', value: totalVisits },
    { label: 'Avg Visits/Case', value: avgVisitsPerPatient },
  ];

  const statusData = [
    { name: 'Active', value: active },
    { name: 'Observation', value: observation },
    { name: 'Imp. Discharge', value: improved },
    { name: 'Non-Imp. Discharge', value: notImproved },
  ];

  const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444'];

  const handleFullReset = (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm("CRITICAL WARNING: This action will permanently DELETE ALL records. Continue?")) {
      if (window.confirm("FINAL RE-CONFIRMATION: Purge entire professional registry?")) {
        if (onResetRegistry) {
          onResetRegistry();
          alert("Clinical registry purged successfully.");
        } else {
          console.error("onResetRegistry prop is missing.");
        }
      }
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">{s.label}</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 mb-6 text-xs uppercase tracking-widest">Outcome Mix</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                  {statusData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 mb-6 text-xs uppercase tracking-widest">HCP Throughput Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={10} tick={{fontWeight: 'bold'}} />
                <YAxis fontSize={10} tick={{fontWeight: 'bold'}} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {statusData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <svg className="w-40 h-40 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path></svg>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-[0.3em]">Registry Governance</h3>
            <p className="text-sm text-slate-400 font-bold mt-2 max-w-xl leading-relaxed">System-wide administrative protocol for clinical data management. Permanent purge requires double confirmation.</p>
          </div>
          <button onClick={handleFullReset} className="px-10 py-5 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-xl transition-all transform active:scale-95 uppercase tracking-widest text-xs">
            Purge Professional Registry
          </button>
        </div>
      </div>
    </div>
  );
};
