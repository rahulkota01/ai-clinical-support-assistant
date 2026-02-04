import React, { useState } from 'react';
import ClinicalLearningEngine, { ClinicalCase } from '../services/clinicalLearningEngine';

interface CaseReviewInterfaceProps {
  learningEngine: ClinicalLearningEngine;
}

export const CaseReviewInterface: React.FC<CaseReviewInterfaceProps> = ({ learningEngine }) => {
  const [currentCase, setCurrentCase] = useState<Partial<ClinicalCase>>({
    caseMetadata: {
      caseId: '',
      date: new Date().toISOString().split('T')[0],
      specialty: 'Medicine',
      reviewer: 'Clinician'
    },
    patientContext: {
      ageGroup: '31-50',
      sex: 'Male',
      majorRiskFactors: [],
      relevantComorbidities: {
        diabetes: false,
        hypertension: false,
        obesity: false,
        heartDisease: false
      }
    },
    presentation: {
      chiefComplaint: '',
      symptomOnset: 'sudden',
      duration: '',
      redFlagSymptoms: {
        present: false,
        symptoms: []
      }
    },
    keyFindings: {
      vitalSignCategory: 'normal',
      imagingSummary: '',
      labsSummary: 'normal'
    },
    systemOutput: {
      riskCategoryAssigned: 'routine',
      keyInterpretationGenerated: '',
      medicationConsiderationsSuggested: [],
      confidenceLevel: 75
    },
    reviewerFeedback: {
      wasRiskClassificationAppropriate: 'yes',
      missedRedFlags: [],
      unnecessaryAlarm: false,
      wereMedicationConsiderationsReasonable: 'yes',
      comments: ''
    },
    logicRefinementNotes: {
      newConditionPatternIdentified: false,
      actionItem: ''
    }
  });

  const [submittedCases, setSubmittedCases] = useState<ClinicalCase[]>([]);
  const [showMetrics, setShowMetrics] = useState(false);

  const riskFactors = ['smoking', 'diabetes', 'HTN', 'obesity'];
  const specialties = ['Medicine', 'Surgery', 'Neuro', 'Pulmonary', 'Cardiology', 'Orthopedics', 'Pediatrics'];
  const reviewers = ['Faculty', 'Clinician', 'Self-review'];
  const ageGroups = ['18-30', '31-50', '>50'];

  const handleSubmit = () => {
    // Validate required fields
    if (!currentCase.caseMetadata?.caseId || !currentCase.presentation?.chiefComplaint) {
      alert('Please fill in Case ID and Chief Complaint');
      return;
    }

    const completeCase: ClinicalCase = {
      caseMetadata: currentCase.caseMetadata!,
      patientContext: currentCase.patientContext!,
      presentation: currentCase.presentation!,
      keyFindings: currentCase.keyFindings!,
      systemOutput: currentCase.systemOutput!,
      reviewerFeedback: currentCase.reviewerFeedback!,
      logicRefinementNotes: currentCase.logicRefinementNotes!
    };

    learningEngine.addCaseReview(completeCase);
    setSubmittedCases([...submittedCases, completeCase]);

    // Reset form
    setCurrentCase({
      ...currentCase,
      caseMetadata: {
        ...currentCase.caseMetadata!,
        caseId: '',
        date: new Date().toISOString().split('T')[0]
      },
      presentation: {
        ...currentCase.presentation!,
        chiefComplaint: '',
        duration: '',
        redFlagSymptoms: {
          present: false,
          symptoms: []
        }
      }
    });

    alert('Case review submitted successfully!');
  };

  const metrics = learningEngine.getLearningMetrics();
  const improvements = learningEngine.getImprovementSuggestions();

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">🧾 Clinical Case Review Interface</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <div className="space-y-6">
          {/* Case Metadata */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">🆔 Case Metadata</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Case ID</label>
                <input
                  type="text"
                  value={currentCase.caseMetadata?.caseId || ''}
                  onChange={(e) => setCurrentCase({
                    ...currentCase,
                    caseMetadata: { ...currentCase.caseMetadata!, caseId: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="CASE-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={currentCase.caseMetadata?.date || ''}
                  onChange={(e) => setCurrentCase({
                    ...currentCase,
                    caseMetadata: { ...currentCase.caseMetadata!, date: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                <select
                  value={currentCase.caseMetadata?.specialty}
                  onChange={(e) => setCurrentCase({
                    ...currentCase,
                    caseMetadata: { ...currentCase.caseMetadata!, specialty: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {specialties.map(spec => <option key={spec} value={spec}>{spec}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer</label>
                <select
                  value={currentCase.caseMetadata?.reviewer}
                  onChange={(e) => setCurrentCase({
                    ...currentCase,
                    caseMetadata: { ...currentCase.caseMetadata!, reviewer: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {reviewers.map(reviewer => <option key={reviewer} value={reviewer}>{reviewer}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Patient Context */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">👤 Patient Context</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
                <select
                  value={currentCase.patientContext?.ageGroup}
                  onChange={(e) => setCurrentCase({
                    ...currentCase,
                    patientContext: { ...currentCase.patientContext!, ageGroup: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ageGroups.map(group => <option key={group} value={group}>{group}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
                <select
                  value={currentCase.patientContext?.sex}
                  onChange={(e) => setCurrentCase({
                    ...currentCase,
                    patientContext: { ...currentCase.patientContext!, sex: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Major Risk Factors</label>
                <div className="space-y-2">
                  {riskFactors.map(factor => (
                    <label key={factor} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={currentCase.patientContext?.majorRiskFactors?.includes(factor) || false}
                        onChange={(e) => {
                          const current = currentCase.patientContext?.majorRiskFactors || [];
                          const updated = e.target.checked
                            ? [...current, factor]
                            : current.filter(f => f !== factor);
                          setCurrentCase({
                            ...currentCase,
                            patientContext: { ...currentCase.patientContext!, majorRiskFactors: updated }
                          });
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{factor}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relevant Comorbidities</label>
                <div className="space-y-2">
                  {Object.entries(currentCase.patientContext?.relevantComorbidities || {}).map(([condition, hasCondition]) => (
                    <label key={condition} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hasCondition}
                        onChange={(e) => setCurrentCase({
                          ...currentCase,
                          patientContext: {
                            ...currentCase.patientContext!,
                            relevantComorbidities: {
                              ...currentCase.patientContext!.relevantComorbidities,
                              [condition]: e.target.checked
                            }
                          }
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 capitalize">{condition.replace(/([A-Z])/g, ' $1')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Presentation */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">🗣️ Presentation</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
                <textarea
                  value={currentCase.presentation?.chiefComplaint || ''}
                  onChange={(e) => setCurrentCase({
                    ...currentCase,
                    presentation: { ...currentCase.presentation!, chiefComplaint: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Patient's main complaint..."
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Symptom Onset</label>
                  <select
                    value={currentCase.presentation?.symptomOnset}
                    onChange={(e) => setCurrentCase({
                      ...currentCase,
                      presentation: { ...currentCase.presentation!, symptomOnset: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sudden">Sudden</option>
                    <option value="gradual">Gradual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={currentCase.presentation?.duration || ''}
                    onChange={(e) => setCurrentCase({
                      ...currentCase,
                      presentation: { ...currentCase.presentation!, duration: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="2 hours, 3 days, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Red Flag Symptoms</label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={currentCase.presentation?.redFlagSymptoms?.present || false}
                      onChange={(e) => setCurrentCase({
                        ...currentCase,
                        presentation: {
                          ...currentCase.presentation!,
                          redFlagSymptoms: {
                            ...currentCase.presentation!.redFlagSymptoms,
                            present: e.target.checked,
                            symptoms: e.target.checked ? currentCase.presentation!.redFlagSymptoms!.symptoms : []
                          }
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Present</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Findings */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">🧪 Key Findings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vital Sign Category</label>
                <select
                  value={currentCase.keyFindings?.vitalSignCategory}
                  onChange={(e) => setCurrentCase({
                    ...currentCase,
                    keyFindings: { ...currentCase.keyFindings!, vitalSignCategory: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">Normal</option>
                  <option value="abnormal">Abnormal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imaging Summary</label>
                <input
                  type="text"
                  value={currentCase.keyFindings?.imagingSummary || ''}
                  onChange={(e) => setCurrentCase({
                    ...currentCase,
                    keyFindings: { ...currentCase.keyFindings!, imagingSummary: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="X-ray, CT, MRI findings..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Labs Summary</label>
                <select
                  value={currentCase.keyFindings?.labsSummary}
                  onChange={(e) => setCurrentCase({
                    ...currentCase,
                    keyFindings: { ...currentCase.keyFindings!, labsSummary: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">Normal</option>
                  <option value="abnormal">Abnormal</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
          </div>

          {/* System Output */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">🧠 System Output</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Risk Category Assigned</label>
                <select
                  value={currentCase.systemOutput?.riskCategoryAssigned}
                  onChange={(e) => setCurrentCase({
                    ...currentCase,
                    systemOutput: { ...currentCase.systemOutput!, riskCategoryAssigned: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key Interpretation Generated</label>
                <textarea
                  value={currentCase.systemOutput?.keyInterpretationGenerated || ''}
                  onChange={(e) => setCurrentCase({
                    ...currentCase,
                    systemOutput: { ...currentCase.systemOutput!, keyInterpretationGenerated: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="System's clinical interpretation..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confidence Level</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={currentCase.systemOutput?.confidenceLevel || 0}
                  onChange={(e) => setCurrentCase({
                    ...currentCase,
                    systemOutput: { ...currentCase.systemOutput!, confidenceLevel: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Reviewer Feedback */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">👨‍⚕️ Reviewer Feedback</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Was Risk Classification Appropriate?</label>
                <select
                  value={currentCase.reviewerFeedback?.wasRiskClassificationAppropriate}
                  onChange={(e) => setCurrentCase({
                    ...currentCase,
                    reviewerFeedback: { ...currentCase.reviewerFeedback!, wasRiskClassificationAppropriate: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Were Medication Considerations Reasonable?</label>
                <select
                  value={currentCase.reviewerFeedback?.wereMedicationConsiderationsReasonable}
                  onChange={(e) => setCurrentCase({
                    ...currentCase,
                    reviewerFeedback: { ...currentCase.reviewerFeedback!, wereMedicationConsiderationsReasonable: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                <textarea
                  value={currentCase.reviewerFeedback?.comments || ''}
                  onChange={(e) => setCurrentCase({
                    ...currentCase,
                    reviewerFeedback: { ...currentCase.reviewerFeedback!, comments: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Detailed feedback on the system's performance..."
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Submit Case Review
          </button>
        </div>

        {/* Metrics Section */}
        <div className="space-y-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">📊 Learning Metrics</h2>
              <button
                onClick={() => setShowMetrics(!showMetrics)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {showMetrics ? 'Hide' : 'Show'}
              </button>
            </div>

            {showMetrics && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm font-medium text-gray-600">Total Cases</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.totalCases}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.confidenceCalibration.averageConfidence.toFixed(1)}%</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Accuracy by Risk Category</h3>
                  <div className="space-y-1">
                    {Object.entries(metrics.accuracyByRiskCategory).map(([category, correct]) => {
                      const values = Object.values(metrics.accuracyByRiskCategory) as number[];
                      const total = values.reduce((a: number, b: number) => a + b, 0);
                      const accuracy = total > 0 ? ((correct as number) / total * 100) : 0;
                      return (
                        <div key={category} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 capitalize">{category}:</span>
                          <span className="text-sm font-medium">{accuracy.toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Improvement Suggestions</h3>
                  <ul className="space-y-1">
                    {improvements.map((suggestion, index) => (
                      <li key={index} className="text-sm text-gray-600">• {suggestion}</li>
                    ))}
                    {improvements.length === 0 && (
                      <li className="text-sm text-green-600">• System performing well</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 Submitted Cases ({submittedCases.length})</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {submittedCases.map((case_, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded text-sm">
                  <div className="font-medium text-gray-900">{case_.caseMetadata.caseId}</div>
                  <div className="text-gray-600">
                    {case_.caseMetadata.specialty} • {case_.caseMetadata.date} • {case_.caseMetadata.reviewer}
                  </div>
                  <div className="text-gray-700">
                    {case_.presentation.chiefComplaint} → {case_.systemOutput.riskCategoryAssigned}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
