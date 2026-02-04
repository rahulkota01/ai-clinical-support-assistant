import React, { useState, useMemo } from 'react';
import { Patient, Visit } from '../types';
import { APP_FOOTER } from '../constants';
import { AIVirtualDoctor } from './AIVirtualDoctor';

interface Props {
  patient: Patient | null;
  onLogout: () => void;
}

export const PatientPortal: React.FC<Props> = ({ patient, onLogout }) => {
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [isApptOpen, setIsApptOpen] = useState(false);

  const [apptForm, setApptForm] = useState({
    name: patient?.fullName || '',
    email: '',
    mobile: '',
    reason: ''
  });

  // Generate patient-friendly message from AI report
  const generatePatientFriendlyMessage = (visit: Visit): string => {
    // IF AI report exists, try to use it directly as it likely contains the patient-friendly version
    // or separate sections. For now, if aiReport exists, we assume it has valuable info.
    if (visit.aiReport && visit.aiReport.length > 100) {
      // Check if there's a specific "Patient-Friendly" section in the report
      if (visit.aiReport.includes("--- Patient-Friendly ---")) {
        return visit.aiReport.split("--- Patient-Friendly ---")[1].split("---")[0].trim();
      }
      if (visit.aiReport.includes("Patient-Friendly")) {
        return visit.aiReport.split("Patient-Friendly")[1].split("---")[0].trim();
      }
      // Otherwise, return the specific section if formatted by Grok/Gemini
      return visit.aiReport;
    }

    const firstName = patient?.fullName?.split(' ')[0] || 'there';

    // Create a simple, reassuring message (Fallback)
    let message = `Hello ${firstName},\n\nBased on your recent visit on ${visit.date}, here's what you should know in simple terms:\n\n`;

    // Add vital signs interpretation if available
    if (visit.vitals) {
      if (visit.vitals.bp) {
        message += `• Blood pressure: ${visit.vitals.bp} - Recorded.\n`;
      }
      if (visit.vitals.hr) {
        message += `• Heart rate: ${visit.vitals.hr} bpm.\n`;
      }
      if (visit.vitals.temp) {
        message += `• Temperature: ${visit.vitals.temp}°F.\n`;
      }
    }

    // Add general reassurance
    message += `\n• Your symptoms are being monitored.\n`;
    message += `• Please follow the treatment plan discussed.\n`;
    message += `• Contact us if symptoms worsen.\n\n`;

    message += `Take care!`;

    return message;
  };

  // CRITICAL FIX: Robust deduplication of visits by ID to stop date spamming
  const uniqueVisits = useMemo(() => {
    if (!patient) return [];
    const seen = new Set();
    return [...patient.visits].filter(v => {
      if (seen.has(v.id)) return false;
      seen.add(v.id);
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [patient]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingStatus('submitting');

    // Simulate booking process
    await new Promise(resolve => setTimeout(resolve, 2000));

    setBookingStatus('success');
    setTimeout(() => {
      setBookingStatus('idle');
      setIsApptOpen(false);
      setApptForm({ name: patient?.fullName || '', email: '', mobile: '', reason: '' });
    }, 2000);
  };

  const RobotIcon = () => (
    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  );

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Patient information not available</p>
          <button onClick={onLogout} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {patient.fullName.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Welcome, {patient.fullName}</h1>
              <p className="text-sm text-gray-600">Patient ID: {patient.id}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-md transition">
            <h3 className="text-xl font-bold mb-3 text-gray-800">Book Appointment</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">Schedule your next consultation with your care team.</p>
            <button
              onClick={() => setIsApptOpen(true)}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-blue-200 shadow-lg"
            >
              Book Now
            </button>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-md transition">
            <h3 className="text-xl font-bold mb-3 text-gray-800">AI Health Assistant</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">Get instant, personalized health guidance 24/7.</p>
            <AIVirtualDoctor patient={patient} />
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-md transition">
            <h3 className="text-xl font-bold mb-3 text-gray-800">Medical Records</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">View your complete visit history and summaries.</p>
            <div className="text-4xl font-black text-blue-600 mb-1">{uniqueVisits.length}</div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Visits</p>
          </div>
        </div>

        {/* Visit History */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Professional Case History Analysis
            </h2>
          </div>

          {uniqueVisits.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No visits recorded</h3>
              <p className="text-gray-600">Your professional medical analysis will appear here after your first consultation.</p>
            </div>
          ) : (
            <div className="divide-y">
              {uniqueVisits.map((visit) => (
                <div key={visit.id} className="p-6 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedVisit(visit)}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <RobotIcon />
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-widest leading-none">Professional Case Analysis</h3>
                        <p className="text-[10px] opacity-60 font-black uppercase tracking-widest mt-1">Visit Recorded: {visit.date}</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Blood Pressure</p>
                      <p className="text-lg font-bold text-gray-900">{visit.vitals?.bp || 'Not recorded'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Heart Rate</p>
                      <p className="text-lg font-bold text-gray-900">{visit.vitals?.hr || 'Not recorded'} bpm</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Temperature</p>
                      <p className="text-lg font-bold text-gray-900">{visit.vitals?.temp || 'Not recorded'}°F</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">SpO2</p>
                      <p className="text-lg font-bold text-gray-900">{visit.vitals?.spo2 || 'Not recorded'}%</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b pb-1">Professional Provider Summary</h4>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed italic">{visit.summary}</p>
                  </div>

                  {/* AI Encouragement Message */}
                  {visit.aiReport && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200 shadow-inner">
                      <h4 className="text-green-900 font-black mb-4 uppercase text-xs tracking-[0.2em] flex items-center">
                        <svg className="w-5 h-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Your Care Team's Message
                      </h4>
                      <div className="prose prose-green prose-sm max-w-none text-green-950">
                        <p className="text-sm leading-relaxed whitespace-pre-line">
                          {generatePatientFriendlyMessage(visit)}
                        </p>
                      </div>
                      <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-300">
                        <p className="text-xs text-green-800 font-medium">
                          💪 <strong>Remember:</strong> You're taking important steps toward better health. Stay consistent with your medications and follow-up appointments. Your healthcare team is here to support you every step of the way.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Visit Detail Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <RobotIcon />
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-widest leading-none">Professional Case Analysis</h3>
                    <p className="text-[10px] opacity-60 font-black uppercase tracking-widest mt-1">Visit Recorded: {selectedVisit.date}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedVisit(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Patient-Friendly Message - ALWAYS SHOWING (Fallback logic included) */}
              <section className="bg-green-50/50 p-6 rounded-[2rem] border border-green-100 shadow-inner mb-6">
                <h4 className="text-green-900 font-black mb-4 uppercase text-xs tracking-[0.2em] flex items-center">
                  <svg className="w-5 h-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Your Personal Health Message
                </h4>
                <div className="prose prose-green prose-sm max-w-none text-green-950">
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {/* Use AI report if valid, otherwise construct one from data */}
                    {selectedVisit.aiReport && selectedVisit.aiReport.length > 50
                      ? generatePatientFriendlyMessage(selectedVisit)
                      : (
                        <>
                          <strong>Condition Details:</strong> Based on your visit for {selectedVisit.complaints || 'general checkup'}, your vitals
                          (BP: {selectedVisit.vitals?.bp || 'N/A'}, HR: {selectedVisit.vitals?.hr || 'N/A'}) have been recorded.
                          We are monitoring your condition closely.<br /><br />

                          <strong>Safety Measures:</strong><br />
                          • Take all prescribed medications as directed.<br />
                          • Maintain good hydration and rest.<br />
                          • Monitor for any worsening of symptoms.<br /><br />

                          <strong>Lifestyle Modifications:</strong><br />
                          • Ensure 7-8 hours of sleep.<br />
                          • Eat a balanced diet rich in vegetables.<br />
                          • Avoid stress and heavy exertion.<br /><br />

                          <strong>Safety Calls (Red Flags):</strong><br />
                          • Seek immediate help if you experience chest pain, severe shortness of breath, or sudden dizziness.<br />
                          • Contact the clinic if fever persists above 101°F.<br /><br />

                          <strong>Doctor's Assurance:</strong><br />
                          "We are with you. Don't worry, your health is our priority and we will monitor your progress closely."
                        </>
                      )
                    }
                  </p>
                </div>
              </section>

              {/* Care & Wellness Guide - NEW */}
              <section className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100 shadow-inner mb-6">
                <h4 className="text-emerald-900 font-black mb-4 uppercase text-xs tracking-[0.2em] flex items-center">
                  <svg className="w-5 h-5 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Care & Wellness Guide
                </h4>
                <div className="space-y-6">
                  <div>
                    <h5 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2">🌱 Lifestyle Modifications</h5>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      Based on your current condition, focus on maintaining a balanced routine.
                      Ensure you get 7-8 hours of quality sleep and stay hydrated throughout the day.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/60 p-4 rounded-2xl border border-emerald-50">
                      <h5 className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2 flex items-center">
                        <span className="mr-2">✅</span> Good Habits
                      </h5>
                      <ul className="text-xs text-slate-600 space-y-1 font-bold">
                        <li>• Regular light morning walks</li>
                        <li>• Mindful eating and hydration</li>
                        <li>• Stress management through breathing</li>
                        <li>• Consistent sleep schedule</li>
                      </ul>
                    </div>
                    <div className="bg-red-50/30 p-4 rounded-2xl border border-red-50">
                      <h5 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2 flex items-center">
                        <span className="mr-2">❌</span> Habits to Avoid
                      </h5>
                      <ul className="text-xs text-slate-600 space-y-1 font-bold">
                        <li>• Late night heavy meals</li>
                        <li>• Excessive caffeine intake</li>
                        <li>• Sedentary behavior</li>
                        <li>• Stressful environments</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                    <h5 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-2 flex items-center">
                      <span className="mr-2">📋</span> Rules for Your Recovery
                    </h5>
                    <ul className="text-xs text-slate-700 space-y-2 font-black">
                      {patient.baselineVitals?.bp && (parseInt(patient.baselineVitals.bp.split('/')[0]) > 130) && (
                        <li className="flex items-start gap-2">
                          <span className="text-red-500">🚩</span>
                          <span>Strictly reduce sodium/salt intake. Avoid processed and canned foods.</span>
                        </li>
                      )}
                      {selectedVisit.complaints && !selectedVisit.complaints.toLowerCase().includes('fracture') && !selectedVisit.complaints.toLowerCase().includes('bone') && (
                        <li className="flex items-start gap-2">
                          <span className="text-blue-500">🏃</span>
                          <span>Engage in tiny, gentle exercises (10-15 mins) daily as tolerated.</span>
                        </li>
                      )}
                      <li className="flex items-start gap-2">
                        <span className="text-amber-500">⚠️</span>
                        <span>Strictly follow the prescribed medication timings without fail.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Professional Analysis - Show AI report OR Fallback summary */}
              <section className="bg-indigo-50/50 p-8 rounded-[2rem] border border-indigo-100 shadow-inner mb-6">
                <h4 className="text-indigo-900 font-black mb-6 uppercase text-xs tracking-[0.2em] flex items-center">
                  <svg className="w-5 h-5 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Professional Clinical Analysis
                </h4>
                <div
                  className="prose prose-indigo prose-sm max-w-none text-indigo-950 font-semibold leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: (selectedVisit.aiReport && selectedVisit.aiReport.length > 50
                      ? selectedVisit.aiReport
                      : `**CLINICAL SUMMARY**\n\n**Patient:** ${patient?.fullName}\n**Complaints:** ${selectedVisit.complaints}\n**Assessment:** Vitals recorded. BP is ${selectedVisit.vitals?.bp}. \n**Plan:** Conservative management. Monitor symptoms. Follow up as needed.\n\n*(Note: Automated clinical summary generated based on recorded data)*`)
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/\n/g, '<br/>')
                  }}
                />

                {/* Doctor Responsibility Note */}
                <div className="mt-8 pt-6 border-t border-indigo-100">
                  <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-indigo-200">
                    <p className="text-xs md:text-sm text-indigo-900 font-black text-center leading-relaxed">
                      "We are with you in this, don't worry. We can help you cure. If any queries or health concerns, please contact us or our AI VIRTUAL DOC."
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Booking Modal */}
      {isApptOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">Book Appointment</h3>
            </div>
            <form onSubmit={handleBooking} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={apptForm.name}
                    onChange={(e) => setApptForm({ ...apptForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={apptForm.email}
                    onChange={(e) => setApptForm({ ...apptForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                  <input
                    type="tel"
                    value={apptForm.mobile}
                    onChange={(e) => setApptForm({ ...apptForm, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit</label>
                  <textarea
                    value={apptForm.reason}
                    onChange={(e) => setApptForm({ ...apptForm, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  type="submit"
                  disabled={bookingStatus === 'submitting'}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {bookingStatus === 'submitting' ? 'Booking...' : 'Book Appointment'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsApptOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
              {bookingStatus === 'success' && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm">Appointment booked successfully!</p>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      {APP_FOOTER}
    </div>
  );
};
