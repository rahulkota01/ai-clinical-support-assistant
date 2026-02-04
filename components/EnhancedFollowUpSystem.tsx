import React, { useState } from 'react';
import { Patient, Visit } from '../types';

interface EnhancedFollowUpSystemProps {
  patients: Patient[];
  userRole: 'ENGINEER' | 'CO-ENGINEER' | 'MENTOR' | null;
  onRevisit: (patient: Patient) => void;
}

export const EnhancedFollowUpSystem: React.FC<EnhancedFollowUpSystemProps> = ({
  patients,
  userRole,
  onRevisit
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Filter patients based on search
  const filteredPatients = patients.filter(p =>
    p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const lastVisit = selectedPatient?.visits && selectedPatient.visits.length > 0
    ? selectedPatient.visits[selectedPatient.visits.length - 1]
    : null;

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Patient Registry & Revisit System</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Authorized Access: <span className="text-indigo-600 font-bold">{userRole || 'GUEST'}</span></p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by ID or Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-sm focus:border-indigo-500 focus:outline-none w-64 transition-all"
          />
          <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
        {/* Patient List */}
        <div className="lg:col-span-1 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col overflow-hidden">
          <div className="p-4 bg-white border-b border-slate-100">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registered Patients ({filteredPatients.length})</h3>
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {filteredPatients.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedPatientId(p.id)}
                className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${selectedPatientId === p.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg transform scale-[1.02]' : 'bg-white border-transparent hover:border-slate-200 text-slate-600'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`font-black text-sm ${selectedPatientId === p.id ? 'text-white' : 'text-slate-800'}`}>{p.fullName}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${selectedPatientId === p.id ? 'text-indigo-200' : 'text-slate-400'}`}>ID: {p.id}</p>
                  </div>
                  {/* Engineer Exclusive: Show Password */}
                  {userRole === 'ENGINEER' && (
                    <div className={`px-2 py-1 rounded-lg text-[10px] font-black font-mono ${selectedPatientId === p.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      PIN: {p.pin}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filteredPatients.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-xs font-bold italic">No patients found</div>
            )}
          </div>
        </div>

        {/* Patient Details & Revisit Status */}
        <div className="lg:col-span-2 flex flex-col">
          {!selectedPatient ? (
            <div className="h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Select a patient to view details</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>
                </div>

                <div className="relative z-10">
                  <h2 className="text-3xl font-black mb-2">{selectedPatient.fullName}</h2>
                  <div className="flex space-x-4 text-indigo-100 font-medium text-sm mb-6">
                    <span>ID: {selectedPatient.id}</span>
                    <span>•</span>
                    <span>{selectedPatient.age} Years</span>
                    <span>•</span>
                    <span>{selectedPatient.sex}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Total Visits</p>
                      <p className="text-2xl font-bold">{selectedPatient.visits.length}</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Current Status</p>
                      <p className="text-xl font-bold">{selectedPatient.status}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] border-2 border-slate-100 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Last Clinical Summary
                  </h3>
                  <span className="text-xs font-bold text-slate-400">{lastVisit ? lastVisit.date : 'No History'}</span>
                </div>

                {lastVisit ? (
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Condition & Symptoms</p>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed">{lastVisit.complaints}</p>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Diagnosis / Analysis</p>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed">{lastVisit.summary}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-center py-8 text-slate-400 text-sm font-medium">No previous visit records found.</p>
                )}

                <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => onRevisit(selectedPatient)}
                    className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition shadow-xl transform active:scale-95 flex items-center"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Create Revisit Card
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
