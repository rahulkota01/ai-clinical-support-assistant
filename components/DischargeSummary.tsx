import React from 'react';
import { Patient, Visit } from '../types';

interface DischargeSummaryProps {
    patient: Patient;
    visit: Visit;
}

export const DischargeSummary: React.FC<DischargeSummaryProps> = ({ patient, visit }) => {
    // Extract key information from AI report
    const extractDiagnosis = (report: string): string => {
        const diagnosisMatch = report.match(/(?:DIAGNOSIS|ASSESSMENT|CLINICAL IMPRESSION)[:\s]+([\s\S]*?)(?=\n\n|PLAN|TREATMENT|$)/i);
        return diagnosisMatch ? diagnosisMatch[1].trim() : 'Please refer to your healthcare provider for detailed diagnosis.';
    };

    const extractLifestyleAdvice = (report: string): string[] => {
        const advice: string[] = [];

        // Extract lifestyle modifications from report
        if (report.toLowerCase().includes('diet') || report.toLowerCase().includes('nutrition')) {
            advice.push('🥗 **Nutrition**: Maintain a balanced diet rich in fruits, vegetables, whole grains, and lean proteins. Stay hydrated with 8-10 glasses of water daily.');
        }

        if (report.toLowerCase().includes('exercise') || report.toLowerCase().includes('activity')) {
            advice.push('🏃 **Physical Activity**: Engage in at least 30 minutes of moderate exercise daily. Walking, swimming, or yoga can significantly improve your health.');
        }

        if (report.toLowerCase().includes('stress') || report.toLowerCase().includes('anxiety')) {
            advice.push('🧘 **Stress Management**: Practice relaxation techniques like deep breathing, meditation, or mindfulness. Ensure 7-8 hours of quality sleep each night.');
        }

        if (report.toLowerCase().includes('smoking') || report.toLowerCase().includes('tobacco')) {
            advice.push('🚭 **Avoid Tobacco**: If you smoke, seek support to quit. Avoid secondhand smoke exposure.');
        }

        if (report.toLowerCase().includes('alcohol')) {
            advice.push('🍷 **Limit Alcohol**: If you drink, do so in moderation. Excessive alcohol can worsen many health conditions.');
        }

        // Default advice if none extracted
        if (advice.length === 0) {
            advice.push('🥗 **Balanced Diet**: Eat nutritious meals with plenty of fruits and vegetables');
            advice.push('🏃 **Stay Active**: Regular physical activity improves overall health');
            advice.push('💤 **Rest Well**: Ensure adequate sleep (7-8 hours nightly)');
            advice.push('💧 **Stay Hydrated**: Drink plenty of water throughout the day');
        }

        return advice;
    };

    const extractWellnessAdvice = (): string[] => {
        return [
            '😊 **Mental Wellness**: Maintain positive social connections. Spend time with loved ones and engage in activities you enjoy.',
            '🎯 **Set Goals**: Set realistic health goals and celebrate small achievements. Progress, not perfection, is key.',
            '📚 **Stay Informed**: Learn about your condition. Knowledge empowers you to make better health decisions.',
            '🤝 **Seek Support**: Don\'t hesitate to reach out to family, friends, or support groups when needed.',
            '🌟 **Stay Positive**: Maintain a positive outlook. Your mental attitude significantly impacts physical healing.',
            '⚠️ **Warning Signs**: Contact your healthcare provider immediately if symptoms worsen or new concerning symptoms appear.'
        ];
    };

    const diagnosis = visit.diagnosis || (visit.aiReport ? extractDiagnosis(visit.aiReport) : 'Clinical assessment completed.');
    const lifestyleAdvice = visit.lifestyleModifications ? [visit.lifestyleModifications] : (visit.aiReport ? extractLifestyleAdvice(visit.aiReport) : []);
    const wellnessAdvice = extractWellnessAdvice();

    return (
        <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border-t-4 border-indigo-600">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-black text-indigo-900 uppercase tracking-tight">Discharge Summary</h1>
                        <p className="text-sm text-slate-500 mt-1">Your Health & Wellness Guide</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Visit Date</p>
                        <p className="text-lg font-bold text-indigo-700">{visit.date}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-indigo-50 rounded-xl">
                    <div>
                        <p className="text-xs text-indigo-600 uppercase tracking-wider font-bold">Patient Name</p>
                        <p className="text-base font-black text-slate-800">{patient.fullName}</p>
                    </div>
                    <div>
                        <p className="text-xs text-indigo-600 uppercase tracking-wider font-bold">Patient ID</p>
                        <p className="text-base font-black text-slate-800">{patient.id}</p>
                    </div>
                </div>
            </div>

            {/* Diagnosis & Assessment */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🏥</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Clinical Assessment</h2>
                        <p className="text-xs text-slate-500">Your Diagnosis & Condition</p>
                    </div>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{diagnosis}</p>
                </div>
            </div>

            {/* Lifestyle Modifications */}
            {lifestyleAdvice.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">🌱</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Lifestyle Modifications</h2>
                            <p className="text-xs text-slate-500">Ways to Improve Your Health</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {lifestyleAdvice.map((advice, index) => (
                            <div key={index} className="bg-green-50 rounded-xl p-4 border-l-4 border-green-500">
                                <p className="text-sm text-slate-700 leading-relaxed">{advice}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Wellness & Happiness Guide */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">💝</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Wellness & Happiness Guide</h2>
                        <p className="text-xs text-slate-500">Living Your Best, Healthiest Life</p>
                    </div>
                </div>
                <div className="space-y-3">
                    {wellnessAdvice.map((advice, index) => (
                        <div key={index} className="bg-purple-50 rounded-xl p-4 border-l-4 border-purple-500">
                            <p className="text-sm text-slate-700 leading-relaxed">{advice}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Complaints & Symptoms */}
            {visit.complaints && (
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">📋</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Your Symptoms</h2>
                            <p className="text-xs text-slate-500">What You Reported</p>
                        </div>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-4 border-l-4 border-orange-500">
                        <p className="text-sm text-slate-700 leading-relaxed">{visit.complaints}</p>
                    </div>
                </div>
            )}

            {/* Vital Signs */}
            {visit.vitals && (
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">❤️</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Your Vital Signs</h2>
                            <p className="text-xs text-slate-500">Measurements Taken</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {visit.vitals.bp && (
                            <div className="bg-red-50 rounded-xl p-4 text-center">
                                <p className="text-xs text-red-600 uppercase tracking-wider font-bold mb-1">Blood Pressure</p>
                                <p className="text-lg font-black text-slate-800">{visit.vitals.bp}</p>
                            </div>
                        )}
                        {visit.vitals.hr && (
                            <div className="bg-pink-50 rounded-xl p-4 text-center">
                                <p className="text-xs text-pink-600 uppercase tracking-wider font-bold mb-1">Heart Rate</p>
                                <p className="text-lg font-black text-slate-800">{visit.vitals.hr}</p>
                            </div>
                        )}
                        {visit.vitals.temp && (
                            <div className="bg-yellow-50 rounded-xl p-4 text-center">
                                <p className="text-xs text-yellow-600 uppercase tracking-wider font-bold mb-1">Temperature</p>
                                <p className="text-lg font-black text-slate-800">{visit.vitals.temp}</p>
                            </div>
                        )}
                        {visit.vitals.spo2 && (
                            <div className="bg-blue-50 rounded-xl p-4 text-center">
                                <p className="text-xs text-blue-600 uppercase tracking-wider font-bold mb-1">SpO2</p>
                                <p className="text-lg font-black text-slate-800">{visit.vitals.spo2}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Print Button */}
            <div className="flex justify-center mt-8">
                <button
                    onClick={() => window.print()}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-wider shadow-lg hover:bg-indigo-700 transition-colors text-sm"
                >
                    🖨️ Print Summary
                </button>
            </div>

            {/* Footer Note */}
            <div className="mt-8 p-6 bg-white rounded-2xl shadow-lg border-l-4 border-yellow-500">
                <p className="text-xs text-slate-600 leading-relaxed">
                    <span className="font-bold text-yellow-700">⚠️ IMPORTANT:</span> This summary is for your reference only.
                    Always consult with your healthcare provider before making any changes to your treatment plan.
                    If you experience severe symptoms or emergencies, seek immediate medical attention.
                </p>
            </div>
        </div>
    );
};

export default DischargeSummary;
