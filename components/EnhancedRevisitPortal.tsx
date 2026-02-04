import React, { useState } from 'react';
import { Patient, Visit, Medication } from '../types';

interface EnhancedRevisitPortalProps {
  patient: Patient;
  onRevisitComplete: (visitData: any) => void;
  onCancel: () => void;
}

export const EnhancedRevisitPortal: React.FC<EnhancedRevisitPortalProps> = ({
  patient,
  onRevisitComplete,
  onCancel
}) => {
  const [revisitData, setRevisitData] = useState({
    complaints: '',
    onExamination: '',
    imagingFindings: '',
    vitals: { bp: '', hr: '', temp: '', spo2: '' },
    labs: { wbc: '', platelets: '', rbc: '', creatinine: '', hemoglobin: '' },
    assessment: '',
    plan: '',
    medications: [] as Medication[],
    followUp: ''
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<string>('');

  const handleGenerateAI = async () => {
    setIsAnalyzing(true);
    try {
      // Simulate AI analysis
      setTimeout(() => {
        setAiReport(`AI Analysis for ${patient.fullName}:

CLINICAL ASSESSMENT:
Patient presents with ${revisitData.complaints || 'new symptoms'}
On examination: ${revisitData.onExamination || 'findings to be documented'}
Imaging: ${revisitData.imagingFindings || 'no new imaging'}

VITAL SIGNS:
BP: ${revisitData.vitals.bp || 'not recorded'}
HR: ${revisitData.vitals.hr || 'not recorded'}
Temp: ${revisitData.vitals.temp || 'not recorded'}
SpO2: ${revisitData.vitals.spo2 || 'not recorded'}

LABORATORY RESULTS:
WBC: ${revisitData.labs.wbc || 'not recorded'}
Platelets: ${revisitData.labs.platelets || 'not recorded'}
RBC: ${revisitData.labs.rbc || 'not recorded'}
Creatinine: ${revisitData.labs.creatinine || 'not recorded'}

ASSESSMENT:
[AI-generated assessment based on clinical data]

PLAN:
[AI-generated treatment plan]

FOLLOW-UP:
[AI-generated follow-up recommendations]`);
        setIsAnalyzing(false);
      }, 2000);
    } catch (error) {
      console.error('AI Analysis failed:', error);
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRevisitComplete({
      ...revisitData,
      date: new Date().toISOString().split('T')[0],
      aiReport
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Patient Revisit Portal</h1>
              <p className="text-gray-600 mt-1">Comprehensive follow-up care for existing patients</p>
            </div>
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Patient Info Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{patient.fullName}</h2>
              <div className="flex gap-6 mt-2 text-blue-100">
                <span>Age: {patient.age}y</span>
                <span>Sex: {patient.sex}</span>
                <span>ID: {patient.id}</span>
                <span>Status: {patient.status}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100">Previous Visits</div>
              <div className="text-2xl font-bold">{patient.visits.length}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Chief Complaints */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-bold">1</span>
              </span>
              Chief Complaints & History
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Complaints
                </label>
                <textarea
                  value={revisitData.complaints}
                  onChange={e => setRevisitData({...revisitData, complaints: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl p-4 h-32 focus:border-blue-500 focus:outline-none"
                  placeholder="Describe patient's current complaints and reason for revisit..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Clinical Examination */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 font-bold">2</span>
              </span>
              Clinical Examination
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  On Examination Findings
                </label>
                <textarea
                  value={revisitData.onExamination}
                  onChange={e => setRevisitData({...revisitData, onExamination: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl p-4 h-24 focus:border-green-500 focus:outline-none"
                  placeholder="Physical examination findings..."
                />
              </div>
            </div>
          </div>

          {/* Imaging & Reports */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-purple-600 font-bold">3</span>
              </span>
              Imaging & Reports
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Imaging Results (CT, MRI, X-ray, etc.)
                </label>
                <textarea
                  value={revisitData.imagingFindings}
                  onChange={e => setRevisitData({...revisitData, imagingFindings: e.target.value})}
                  className="w-full border-2 border-gray-200 rounded-xl p-4 h-32 focus:border-purple-500 focus:outline-none"
                  placeholder="Radiology and other imaging findings..."
                />
              </div>
            </div>
          </div>

          {/* Vitals & Labs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-red-600 font-bold">4</span>
                </span>
                Vital Signs
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="BP (120/80)"
                  value={revisitData.vitals.bp}
                  onChange={e => setRevisitData({...revisitData, vitals: {...revisitData.vitals, bp: e.target.value}})}
                  className="border-2 border-gray-200 rounded-xl p-3 focus:border-red-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="HR (72)"
                  value={revisitData.vitals.hr}
                  onChange={e => setRevisitData({...revisitData, vitals: {...revisitData.vitals, hr: e.target.value}})}
                  className="border-2 border-gray-200 rounded-xl p-3 focus:border-red-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Temp (98.6°F)"
                  value={revisitData.vitals.temp}
                  onChange={e => setRevisitData({...revisitData, vitals: {...revisitData.vitals, temp: e.target.value}})}
                  className="border-2 border-gray-200 rounded-xl p-3 focus:border-red-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="SpO2 (98%)"
                  value={revisitData.vitals.spo2}
                  onChange={e => setRevisitData({...revisitData, vitals: {...revisitData.vitals, spo2: e.target.value}})}
                  className="border-2 border-gray-200 rounded-xl p-3 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-yellow-600 font-bold">5</span>
                </span>
                Laboratory Results
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="WBC"
                  value={revisitData.labs.wbc}
                  onChange={e => setRevisitData({...revisitData, labs: {...revisitData.labs, wbc: e.target.value}})}
                  className="border-2 border-gray-200 rounded-xl p-3 focus:border-yellow-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Platelets"
                  value={revisitData.labs.platelets}
                  onChange={e => setRevisitData({...revisitData, labs: {...revisitData.labs, platelets: e.target.value}})}
                  className="border-2 border-gray-200 rounded-xl p-3 focus:border-yellow-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="RBC"
                  value={revisitData.labs.rbc}
                  onChange={e => setRevisitData({...revisitData, labs: {...revisitData.labs, rbc: e.target.value}})}
                  className="border-2 border-gray-200 rounded-xl p-3 focus:border-yellow-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Creatinine"
                  value={revisitData.labs.creatinine}
                  onChange={e => setRevisitData({...revisitData, labs: {...revisitData.labs, creatinine: e.target.value}})}
                  className="border-2 border-gray-200 rounded-xl p-3 focus:border-yellow-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* AI Analysis Section */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-indigo-600 font-bold">AI</span>
                </span>
                AI Clinical Analysis
              </h3>
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={isAnalyzing}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {isAnalyzing ? 'Analyzing...' : 'Generate AI Analysis'}
              </button>
            </div>
            
            {aiReport && (
              <div className="bg-white rounded-xl p-4 mt-4">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{aiReport}</pre>
              </div>
            )}
          </div>

          {/* Assessment & Plan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Clinical Assessment</h3>
              <textarea
                value={revisitData.assessment}
                onChange={e => setRevisitData({...revisitData, assessment: e.target.value})}
                className="w-full border-2 border-gray-200 rounded-xl p-4 h-32 focus:border-blue-500 focus:outline-none"
                placeholder="Your clinical assessment..."
              />
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Treatment Plan</h3>
              <textarea
                value={revisitData.plan}
                onChange={e => setRevisitData({...revisitData, plan: e.target.value})}
                className="w-full border-2 border-gray-200 rounded-xl p-4 h-32 focus:border-green-500 focus:outline-none"
                placeholder="Treatment plan..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition"
            >
              Complete Revisit & Save
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
