import React, { useState, useEffect } from 'react';
import { ViewState, Patient } from './types';
import HCPPortal from './components/HCPPortal';
import { PatientPortal } from './components/PatientPortal';
import { APP_FOOTER } from './constants';
import { AIVirtualDoctor } from './components/AIVirtualDoctor';

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>('PATIENT_LOGIN');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loggedInPatient, setLoggedInPatient] = useState<Patient | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Auth States
  const [patientId, setPatientId] = useState('');
  const [patientPin, setPatientPin] = useState('');
  const [hcpPass, setHcpPass] = useState('');
  const [userRole, setUserRole] = useState<'ENGINEER' | 'CO-ENGINEER' | 'MENTOR' | null>(null);

  // Load persistence
  useEffect(() => {
    const saved = localStorage.getItem('hospital_patients');
    if (saved) {
      try {
        setPatients(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse registry data.");
      }
    }
  }, []);

  // Save persistence
  useEffect(() => {
    if (patients.length > 0) {
      localStorage.setItem('hospital_patients', JSON.stringify(patients));
    }
  }, [patients]);

  // Patient login handler
  const handlePatientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === patientId && p.pin === patientPin);
    if (patient) {
      setLoggedInPatient(patient);
      setViewState('PATIENT_DASHBOARD');
      setLoginError(null);
    } else {
      setLoginError('Invalid patient ID or PIN');
    }
  };

  // HCP login handler
  const handleHCPLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Role-based Access Control
    if (hcpPass === 'rahul0101') {
      setUserRole('ENGINEER');
      setViewState('HCP_DASHBOARD');
      setLoginError(null);
    } else if (hcpPass === 'staff2026') {
      setUserRole('CO-ENGINEER');
      setViewState('HCP_DASHBOARD');
      setLoginError(null);
    } else if (hcpPass === 'mentor777') {
      setUserRole('MENTOR');
      setViewState('HCP_DASHBOARD');
      setLoginError(null);
    } else {
      setLoginError('Invalid Access Key. Please enter a valid authorized credential.');
    }
  };

  // Patient management handlers
  const addPatient = (patient: Patient) => {
    setPatients(prev => [...prev, patient]);
  };

  const updatePatient = (patient: Patient) => {
    setPatients(prev => prev.map(p => p.id === patient.id ? patient : p));
  };

  const deletePatients = (patientIds: string[]) => {
    setPatients(prev => prev.filter(p => !patientIds.includes(p.id)));
  };

  const handleResetRegistry = () => {
    setPatients([]);
    localStorage.removeItem('hospital_patients');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {viewState === 'PATIENT_LOGIN' && (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-2xl border-t-4 border-blue-600">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Patient Portal</h2>
              <p className="mt-2 text-sm text-gray-600">Access your medical records</p>
            </div>

            <form className="space-y-6" onSubmit={handlePatientLogin}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                <input
                  required
                  type="text"
                  value={patientId}
                  onChange={e => setPatientId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your patient ID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PIN</label>
                <input
                  required
                  type="password"
                  value={patientPin}
                  onChange={e => setPatientPin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your PIN"
                />
              </div>

              {loginError && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                  <p className="text-red-600 text-sm">{loginError}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Sign In
              </button>
            </form>

            <div className="pt-4 text-center border-t">
              <button
                onClick={() => {
                  setViewState('HCP_LOGIN');
                  setLoginError(null);
                  setPatientId('');
                  setPatientPin('');
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Healthcare Provider Access
              </button>
            </div>
          </div>
          {APP_FOOTER}
        </div>
      )}

      {viewState === 'HCP_LOGIN' && (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-900">
          <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-2xl border-t-8 border-indigo-600">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white mb-4">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.040L3 20l9 2 9-2-1.382-14.016z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-slate-900">Staff Verification</h2>
              <p className="mt-2 text-[10px] text-indigo-500 font-black uppercase tracking-[0.2em]">Authorized HCP Access</p>
            </div>

            <form className="space-y-6" onSubmit={handleHCPLogin}>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Access Key</label>
                <input
                  required
                  type="password"
                  value={hcpPass}
                  onChange={e => setHcpPass(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-transparent rounded-2xl text-slate-900 focus:ring-2 focus:ring-slate-800 focus:bg-white transition outline-none text-sm font-bold"
                  placeholder="Verification Required"
                />
              </div>

              {loginError && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center space-x-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="bg-red-500 text-white rounded-full p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{loginError}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-black transition active:scale-95"
              >
                Verify Hub
              </button>
            </form>

            <div className="pt-4 text-center border-t">
              <button
                onClick={() => {
                  setViewState('PATIENT_LOGIN');
                  setLoginError(null);
                  setHcpPass('');
                }}
                className="text-gray-500 font-black text-[10px] uppercase tracking-widest hover:underline"
              >
                Return to Patient Login
              </button>
            </div>
          </div>
          {APP_FOOTER}
        </div>
      )}

      {viewState === 'PATIENT_DASHBOARD' && loggedInPatient && (
        <PatientPortal
          patient={loggedInPatient}
          onLogout={() => {
            setViewState('PATIENT_LOGIN');
            setLoggedInPatient(null);
            setPatientId('');
            setPatientPin('');
          }}
        />
      )}

      {viewState === 'HCP_DASHBOARD' && (
        <HCPPortal
          patients={patients}
          userRole={userRole}
          onAddPatient={addPatient}
          onUpdatePatient={updatePatient}
          onResetRegistry={handleResetRegistry}
          onLogout={() => {
            setViewState('HCP_LOGIN');
            setUserRole(null);
            setHcpPass('');
          }}
          onDeletePatients={deletePatients}
        />
      )}
    </div>
  );
};

export default App;
