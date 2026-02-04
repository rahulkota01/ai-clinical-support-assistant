import React, { useState, useEffect } from 'react';
import { Patient, Visit } from '../types';

interface PastCasesDiagnosisProps {
  patients: Patient[];
  onSelectDiagnosis: (diagnosis: string) => void;
}

export const PastCasesDiagnosis: React.FC<PastCasesDiagnosisProps> = ({
  patients,
  onSelectDiagnosis
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [filteredCases, setFilteredCases] = useState<Array<{
    patient: Patient;
    visit: Visit;
    diagnosis: string;
    date: string;
  }>>([]);

  useEffect(() => {
    // Extract all past cases with diagnoses
    const allCases: Array<{
      patient: Patient;
      visit: Visit;
      diagnosis: string;
      date: string;
    }> = [];

    patients.forEach(patient => {
      patient.visits.forEach(visit => {
        if (visit.diagnosis || visit.finalDiagnosis || visit.aiReport) {
          const diagnosis = visit.finalDiagnosis || visit.diagnosis || 
            (visit.aiReport ? extractDiagnosisFromAI(visit.aiReport) : 'Unknown diagnosis');
          
          allCases.push({
            patient,
            visit,
            diagnosis,
            date: visit.date
          });
        }
      });
    });

    // Filter cases based on search and date
    let filtered = allCases;
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.patient.complaints.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedDate) {
      filtered = filtered.filter(item => 
        item.date.includes(selectedDate)
      );
    }

    // Sort by date (most recent first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setFilteredCases(filtered);
  }, [patients, searchTerm, selectedDate]);

  const extractDiagnosisFromAI = (aiReport: string): string => {
    // Extract diagnosis from AI report
    const lines = aiReport.split('\n');
    const diagnosisLine = lines.find(line => 
      line.toLowerCase().includes('diagnosis') || 
      line.toLowerCase().includes('assessment')
    );
    return diagnosisLine ? diagnosisLine.split(':')[1]?.trim() || aiReport.substring(0, 100) : aiReport.substring(0, 100);
  };

  const getUniqueDates = () => {
    const dates = new Set<string>();
    patients.forEach(patient => {
      patient.visits.forEach(visit => {
        if (visit.date) {
          dates.add(visit.date);
        }
      });
    });
    return Array.from(dates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">📋 Past Cases Diagnosis Library</h3>
        <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {filteredCases.length} cases found
        </div>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">🔍 Search Cases</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by diagnosis, patient name, or symptoms..."
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Filter by Date</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All dates</option>
            {getUniqueDates().map(date => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cases List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredCases.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No cases found</p>
            <p className="text-xs mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredCases.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-gray-900">{item.patient.fullName}</span>
                    <span className="text-xs text-gray-500">• {item.patient.age}y {item.patient.sex}</span>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {item.patient.id}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    📅 {item.date}
                  </div>
                </div>
                <button
                  onClick={() => onSelectDiagnosis(item.diagnosis)}
                  className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition"
                >
                  Use This
                </button>
              </div>
              
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-semibold text-gray-700">🩺 Diagnosis:</span>
                  <p className="text-sm text-gray-900 mt-1">{item.diagnosis}</p>
                </div>
                
                <div>
                  <span className="text-xs font-semibold text-gray-700">📝 Chief Complaints:</span>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{item.visit.complaints}</p>
                </div>
                
                {item.visit.vitals && (
                  <div className="flex gap-4 text-xs text-gray-600">
                    <span>BP: {item.visit.vitals.bp}</span>
                    <span>HR: {item.visit.vitals.hr}</span>
                    <span>Temp: {item.visit.vitals.temp}</span>
                    <span>SpO2: {item.visit.vitals.spo2}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800 font-medium">
          💡 <strong>How to use:</strong> Search for past cases by diagnosis, patient name, or symptoms. 
          Click "Use This" to apply a past diagnosis to the current patient.
        </p>
      </div>
    </div>
  );
};
