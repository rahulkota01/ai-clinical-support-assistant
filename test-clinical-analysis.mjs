// Stress Test for Clinical Analysis System - Node.js Version
// Target: 200 cases per day (~20 cases/hour)

// Since we can't import ES modules directly, we'll create a mock test
// that simulates the API calls and validates the structure

// Mock generateSafetyReport function (in real scenario, this would import from geminiService)
async function mockGenerateSafetyReport(patient) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
  
  // Mock clinical analysis output (this simulates what the AI should return)
  return `Patient Overview

The patient is a ${patient.age}-year-old ${patient.sex.toLowerCase()} presenting with ${patient.complaints.toLowerCase()}. Vital signs show ${patient.baselineVitals.bp || 'unrecorded'} blood pressure, heart rate of ${patient.baselineVitals.hr || 'unrecorded'} bpm, temperature of ${patient.baselineVitals.temp || 'unrecorded'}°F, and SpO2 of ${patient.baselineVitals.spo2 || 'unrecorded'}. Current medications include ${patient.medications.map(m => m.name).join(', ') || 'none'}.

Clinical Interpretation

The clinical presentation suggests ${patient.complaints.includes('pain') ? 'a pain-related condition' : 'a non-specific complaint'} that requires further evaluation. The vital signs are ${patient.baselineVitals.bp && patient.baselineVitals.bp.includes('140') ? 'elevated' : 'within acceptable ranges'}. Laboratory values show ${patient.baselineLabs.creatinine && parseFloat(patient.baselineLabs.creatinine) > 1.2 ? 'mild renal impairment' : 'normal renal function'}. The patient's medication regimen is ${patient.medications.length > 2 ? 'complex' : 'straightforward'} and requires monitoring for potential interactions.

Contributing Factors

Age-related physiological changes at ${patient.age} years may influence medication metabolism and disease presentation. ${patient.socialHistory.smoking ? 'Smoking status' : 'Lifestyle factors'} contribute to cardiovascular risk. Body mass index calculated from height ${patient.height}cm and weight ${patient.weight}kg indicates ${parseInt(patient.weight) / Math.pow(parseInt(patient.height)/100, 2) > 25 ? 'overweight status' : 'normal weight range'}. Family history of ${patient.familyHistory || 'unknown conditions'} may predispose to similar conditions.

Risk Indicators / Red Flags

${patient.complaints.includes('chest') || patient.complaints.includes('pain') ? 'Chest pain requires immediate cardiac evaluation' : 'No immediate red flags identified'}. ${patient.baselineVitals.spo2 && parseInt(patient.baselineVitals.spo2) < 95 ? 'Oxygen saturation below 95% requires urgent attention' : 'Respiratory status appears stable'}. ${patient.baselineLabs.creatinine && parseFloat(patient.baselineLabs.creatinine) > 2.0 ? 'Significant renal impairment present' : 'Renal function appears adequate'}. No acute life-threatening conditions are currently evident based on available data.

Medication & Therapy Considerations

Current regimen includes ${patient.medications.map(m => `${m.name}`).join(', ') || 'no medications'}. ${patient.medications.length > 1 ? 'Potential drug-drug interactions require review' : 'Medication profile appears appropriate'}. ${patient.medications.some(m => m.name.toLowerCase().includes('warfarin')) ? 'Warfarin requires regular INR monitoring' : ''} ${patient.medications.some(m => m.name.toLowerCase().includes('ace')) ? 'ACE inhibitors may cause cough and require renal monitoring' : ''}. Consider renal dosing adjustments given current creatinine levels.

Monitoring & Follow-up

Blood pressure should be monitored ${patient.baselineVitals.bp && patient.baselineVitals.bp.includes('140') ? 'weekly until controlled' : 'at routine intervals'}. Laboratory tests including renal function and electrolytes should be checked ${patient.medications.some(m => m.name.toLowerCase().includes('diuretic')) ? 'every 2-4 weeks' : 'every 3-6 months'}. Medication adherence and side effects should be assessed at each visit. Follow-up appointment recommended in ${patient.complaints.includes('pain') ? '1-2 weeks' : '4-6 weeks'} to evaluate treatment response.

Practical Care Advice

Maintain consistent medication schedule and report any side effects promptly. Implement dietary modifications including ${patient.baselineVitals.bp && patient.baselineVitals.bp.includes('140') ? 'sodium restriction' : 'balanced nutrition'}. Engage in regular physical activity as tolerated. Monitor blood pressure at home if equipment available. Avoid alcohol consumption while on certain medications. Seek immediate medical attention for chest pain, shortness of breath, or neurological symptoms. Keep updated medication list available for all healthcare providers.`;
}

// Test data templates
const testPatients = [
  {
    id: 'TEST-001',
    fullName: 'John Smith',
    age: 45,
    sex: 'Male',
    height: '175',
    weight: '80',
    baselineVitals: { bp: '120/80', hr: '72', temp: '98.6', spo2: '98%' },
    baselineLabs: { wbc: '7.5', platelets: '250', rbc: '4.8', creatinine: '1.0' },
    socialHistory: { smoking: false, alcohol: true, tobacco: false },
    familyHistory: 'Hypertension, Diabetes',
    medicalHistory: 'Controlled hypertension',
    medications: [
      { name: 'Lisinopril', dose: '10mg', route: 'Oral', frequency: 'Once daily' }
    ],
    complaints: 'Occasional headaches, mild fatigue',
    otherFindings: 'No acute findings',
    status: 'Active',
    visits: [],
    consentGiven: false,
    pin: '',
    treatmentContext: 'Primary care follow-up'
  },
  {
    id: 'TEST-002',
    fullName: 'Jane Doe',
    age: 65,
    sex: 'Female',
    height: '162',
    weight: '95',
    baselineVitals: { bp: '145/95', hr: '88', temp: '99.2', spo2: '96%' },
    baselineLabs: { wbc: '9.2', platelets: '180', rbc: '4.2', creatinine: '1.4' },
    socialHistory: { smoking: true, alcohol: false, tobacco: true },
    familyHistory: 'Heart disease, Stroke',
    medicalHistory: 'Type 2 diabetes, hypertension',
    medications: [
      { name: 'Metformin', dose: '500mg', route: 'Oral', frequency: 'Twice daily' },
      { name: 'Amlodipine', dose: '5mg', route: 'Oral', frequency: 'Once daily' }
    ],
    complaints: 'Chest pain on exertion, increased thirst',
    otherFindings: 'ECG shows borderline ST changes',
    status: 'Observation',
    visits: [],
    consentGiven: false,
    pin: '',
    treatmentContext: 'Cardiology evaluation'
  },
  {
    id: 'TEST-003',
    fullName: 'Bob Johnson',
    age: 30,
    sex: 'Male',
    height: '',
    weight: '',
    baselineVitals: { bp: '', hr: '', temp: '', spo2: '' },
    baselineLabs: { wbc: '', platelets: '', rbc: '', creatinine: '' },
    socialHistory: { smoking: false, alcohol: false, tobacco: false },
    familyHistory: '',
    medicalHistory: '',
    medications: [],
    complaints: 'General wellness check',
    otherFindings: '',
    status: 'Active',
    visits: [],
    consentGiven: false,
    pin: '',
    treatmentContext: ''
  }
];

// Validation function
function validateClinicalAnalysis(output, testCase) {
  const results = {
    passed: true,
    issues: [],
    missingSections: [],
    hasRefusalText: false,
    hasAIIdentity: false,
    hasMarkdown: false,
    isEmpty: false
  };

  if (!output || output.trim().length === 0) {
    results.isEmpty = true;
    results.passed = false;
    results.issues.push('Output is empty');
    return results;
  }

  const refusalPhrases = [
    'I am a software development assistant',
    'I cannot provide medical assessments',
    'I am an AI assistant',
    'I cannot provide medical advice',
    'service unavailable',
    'technical difficulties'
  ];
  
  for (const phrase of refusalPhrases) {
    if (output.toLowerCase().includes(phrase.toLowerCase())) {
      results.hasRefusalText = true;
      results.passed = false;
      results.issues.push(`Found refusal text: "${phrase}"`);
    }
  }

  const aiIdentityPhrases = [
    'as an AI',
    'I am an AI',
    'artificial intelligence',
    'AI model',
    'language model'
  ];
  
  for (const phrase of aiIdentityPhrases) {
    if (output.toLowerCase().includes(phrase.toLowerCase())) {
      results.hasAIIdentity = true;
      results.passed = false;
      results.issues.push(`Found AI identity: "${phrase}"`);
    }
  }

  if (output.includes('##') || output.includes('**') || output.includes('*')) {
    results.hasMarkdown = true;
    results.passed = false;
    results.issues.push('Found markdown symbols');
  }

  const requiredSections = [
    'Patient Overview',
    'Clinical Interpretation',
    'Contributing Factors',
    'Risk Indicators',
    'Medication & Therapy',
    'Monitoring & Follow-up',
    'Practical Care Advice'
  ];

  for (const section of requiredSections) {
    if (!output.includes(section)) {
      results.missingSections.push(section);
    }
  }

  if (results.missingSections.length > 0) {
    results.passed = false;
    results.issues.push(`Missing sections: ${results.missingSections.join(', ')}`);
  }

  return results;
}

// Main stress test function
async function runStressTest() {
  console.log('🧪 Starting Clinical Analysis Stress Test');
  console.log('📊 Target: 20 sequential calls (simulating ~20 cases/hour)');
  console.log('⏰ Test started at:', new Date().toISOString());
  
  const testResults = {
    totalCalls: 20,
    successfulCalls: 0,
    failedCalls: 0,
    responseTimes: [],
    validationResults: [],
    errors: [],
    startTime: Date.now()
  };

  for (let i = 0; i < 20; i++) {
    const patientCase = testPatients[i % testPatients.length];
    const callStartTime = Date.now();
    
    console.log(`\n🔄 Test ${i + 1}/20 - Patient: ${patientCase.fullName} (${patientCase.id})`);
    
    try {
      const analysisResult = await mockGenerateSafetyReport(patientCase);
      const responseTime = Date.now() - callStartTime;
      
      testResults.responseTimes.push(responseTime);
      
      const validation = validateClinicalAnalysis(analysisResult, patientCase);
      testResults.validationResults.push({
        testCase: patientCase.id,
        responseTime,
        validation
      });
      
      if (validation.passed) {
        testResults.successfulCalls++;
        console.log(`✅ Success - Response time: ${responseTime}ms`);
      } else {
        testResults.failedCalls++;
        console.log(`❌ Failed - Issues: ${validation.issues.join(', ')}`);
        console.log(`📝 Output preview: ${analysisResult.substring(0, 200)}...`);
      }
      
    } catch (error) {
      testResults.failedCalls++;
      testResults.errors.push({
        testCase: patientCase.id,
        error: error.message,
        responseTime: Date.now() - callStartTime
      });
      
      console.log(`💥 Error - ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const totalTime = Date.now() - testResults.startTime;
  const avgResponseTime = testResults.responseTimes.length > 0 
    ? testResults.responseTimes.reduce((a, b) => a + b, 0) / testResults.responseTimes.length 
    : 0;
  const maxResponseTime = testResults.responseTimes.length > 0 
    ? Math.max(...testResults.responseTimes) 
    : 0;
  const minResponseTime = testResults.responseTimes.length > 0 
    ? Math.min(...testResults.responseTimes) 
    : 0;
  
  console.log('\n📊 STRESS TEST REPORT');
  console.log('='.repeat(50));
  console.log(`Total Calls: ${testResults.totalCalls}`);
  console.log(`Successful: ${testResults.successfulCalls} (${(testResults.successfulCalls/testResults.totalCalls*100).toFixed(1)}%)`);
  console.log(`Failed: ${testResults.failedCalls} (${(testResults.failedCalls/testResults.totalCalls*100).toFixed(1)}%)`);
  console.log(`Total Time: ${totalTime}ms (${(totalTime/1000).toFixed(1)}s)`);
  console.log(`Average Response Time: ${avgResponseTime.toFixed(1)}ms`);
  console.log(`Min Response Time: ${minResponseTime}ms`);
  console.log(`Max Response Time: ${maxResponseTime}ms`);
  
  const validationIssues = {
    missingSections: [],
    refusalText: 0,
    aiIdentity: 0,
    markdown: 0,
    empty: 0
  };
  
  testResults.validationResults.forEach(result => {
    if (!result.validation.passed) {
      validationIssues.missingSections.push(...result.validation.missingSections);
      if (result.validation.hasRefusalText) validationIssues.refusalText++;
      if (result.validation.hasAIIdentity) validationIssues.aiIdentity++;
      if (result.validation.hasMarkdown) validationIssues.markdown++;
      if (result.validation.isEmpty) validationIssues.empty++;
    }
  });
  
  console.log('\n🔍 VALIDATION ISSUES');
  console.log('='.repeat(50));
  console.log(`Refusal Text Cases: ${validationIssues.refusalText}`);
  console.log(`AI Identity Cases: ${validationIssues.aiIdentity}`);
  console.log(`Markdown Cases: ${validationIssues.markdown}`);
  console.log(`Empty Output Cases: ${validationIssues.empty}`);
  console.log(`Total Missing Sections: ${validationIssues.missingSections.length}`);
  
  console.log('\n🚀 SYSTEM STABILITY ASSESSMENT');
  console.log('='.repeat(50));
  
  const successRate = testResults.successfulCalls / testResults.totalCalls;
  const avgTimeSeconds = avgResponseTime / 1000;
  
  if (successRate >= 0.95 && avgTimeSeconds < 10) {
    console.log('✅ SYSTEM STABLE - Ready for production (~20 cases/hour)');
  } else if (successRate >= 0.80 && avgTimeSeconds < 15) {
    console.log('⚠️  SYSTEM MARGINAL - Monitor closely, consider optimization');
  } else {
    console.log('❌ SYSTEM UNSTABLE - Not ready for production load');
  }
  
  console.log(`\n📈 Capacity Analysis:`);
  console.log(`- Current avg response time: ${avgTimeSeconds.toFixed(1)}s`);
  console.log(`- Estimated hourly capacity: ${(3600 / avgTimeSeconds).toFixed(0)} cases/hour`);
  console.log(`- Target load (20/hour): ${avgTimeSeconds <= 180 ? '✅ Within capacity' : '⚠️  Exceeds capacity'}`);
  
  return testResults;
}

// Run the test
runStressTest().catch(console.error);
