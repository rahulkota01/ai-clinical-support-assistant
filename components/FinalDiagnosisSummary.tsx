import React, { useState } from 'react';

interface FinalDiagnosisData {
  type: 'manual' | 'ai' | 'logic';
  diagnosis: string;
  confidence: number;
}

interface FinalDiagnosisSummaryProps {
  finalDiagnosis: FinalDiagnosisData;
  setFinalDiagnosis: (diagnosis: FinalDiagnosisData) => void;
}

export const FinalDiagnosisSummary: React.FC<FinalDiagnosisSummaryProps> = ({
  finalDiagnosis,
  setFinalDiagnosis
}) => {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-2xl mb-8 border border-purple-200">
      <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-6 flex items-center">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Final Diagnosis Summary
      </h4>
      
      <div className="mb-4">
        <label className="text-xs font-black text-slate-600 uppercase tracking-widest mb-2 block">Diagnosis Method</label>
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => setFinalDiagnosis({...finalDiagnosis, type: 'manual'})}
            className={`flex-1 py-2 px-3 rounded-lg font-black text-[9px] uppercase transition ${
              finalDiagnosis.type === 'manual' 
                ? 'bg-purple-600 text-white shadow-lg' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Manual Diagnosis
          </button>
          <button
            onClick={() => setFinalDiagnosis({...finalDiagnosis, type: 'ai'})}
            className={`flex-1 py-2 px-3 rounded-lg font-black text-[9px] uppercase transition ${
              finalDiagnosis.type === 'ai' 
                ? 'bg-purple-600 text-white shadow-lg' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            AI Diagnosis
          </button>
          <button
            onClick={() => setFinalDiagnosis({...finalDiagnosis, type: 'logic'})}
            className={`flex-1 py-2 px-3 rounded-lg font-black text-[9px] uppercase transition ${
              finalDiagnosis.type === 'logic' 
                ? 'bg-purple-600 text-white shadow-lg' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Logic-Based
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 block">Final Diagnosis</label>
          <textarea
            value={finalDiagnosis.diagnosis}
            onChange={(e) => setFinalDiagnosis({...finalDiagnosis, diagnosis: e.target.value})}
            placeholder="Enter final diagnosis based on clinical analysis..."
            className="w-full border-2 border-purple-100 rounded-xl p-4 text-sm font-bold h-32 resize-none focus:border-purple-300 focus:outline-none"
          />
        </div>
        
        <div>
          <label className="text-xs font-black text-slate-600 uppercase tracking-wider mb-2 block">Confidence Level</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="100"
              value={finalDiagnosis.confidence}
              onChange={(e) => setFinalDiagnosis({...finalDiagnosis, confidence: parseInt(e.target.value)})}
              className="flex-1"
            />
            <span className="text-purple-900 font-black text-sm w-12 text-right">{finalDiagnosis.confidence}%</span>
          </div>
          <div className="flex-1 bg-purple-200 rounded-full h-2 mt-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{width: `${finalDiagnosis.confidence}%`}}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
