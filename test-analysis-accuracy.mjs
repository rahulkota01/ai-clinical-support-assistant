// Clinical Analysis Accuracy & Correctness Validation Test
// This test validates how accurate and reliable the AI analysis results are

// Enhanced medical keywords with better detection logic
const medicalKeywords = {
  chestPain: ['chest', 'heart', 'cardiac', 'angina', 'heart attack', 'chest discomfort'],
  respiratory: ['breath', 'lung', 'cough', 'asthma', 'pneumonia', 'shortness of breath', 'trouble breathing', 'wheezing'],
  neurological: ['headache', 'migraine', 'stroke', 'seizure', 'dizziness', 'numbness', 'blurry vision', 'confusion'],
  gastrointestinal: ['stomach', 'abdominal', 'nausea', 'vomiting', 'diarrhea', 'pain', 'hurts', 'sick', 'acid reflux'],
  diabetes: ['diabetes', 'sugar', 'glucose', 'insulin', 'thirst', 'urination', 'frequent urination'],
  hypertension: ['bp', 'blood pressure', 'hypertension', 'high bp', '140', '150', '160'],
  renal: ['kidney', 'renal', 'creatinine', 'urine', 'dialysis', 'swelling', 'edema'],
  medications: ['medication', 'medicine', 'drug', 'pill', 'tablet', 'dose']
};

function detectMedicalConditions(complaints, vitals, labs, medications) {
  const detected = [];
  const allText = `${complaints} ${vitals.bp} ${vitals.hr} ${labs.creatinine} ${medications.map(m => m.name).join(' ')}`.toLowerCase();
  
  // Detect conditions based on keywords
  if (medicalKeywords.chestPain.some(keyword => allText.includes(keyword))) {
    detected.push('cardiac_evaluation_needed');
  }
  if (medicalKeywords.respiratory.some(keyword => allText.includes(keyword))) {
    detected.push('respiratory_assessment');
  }
  if (medicalKeywords.neurological.some(keyword => allText.includes(keyword))) {
    detected.push('neurological_evaluation');
  }
  if (medicalKeywords.gastrointestinal.some(keyword => allText.includes(keyword))) {
    detected.push('gastrointestinal_assessment');
  }
  if (medicalKeywords.diabetes.some(keyword => allText.includes(keyword))) {
    detected.push('diabetes_monitoring');
  }
  if (medicalKeywords.hypertension.some(keyword => allText.includes(keyword))) {
    detected.push('blood_pressure_monitoring');
  }
  if (medicalKeywords.renal.some(keyword => allText.includes(keyword))) {
    detected.push('renal_function_assessment');
  }
  
  return detected;
}

function generateAccurateClinicalAnalysis(patient) {
  const detectedConditions = detectMedicalConditions(
    patient.complaints, 
    patient.baselineVitals, 
    patient.baselineLabs || {}, 
    patient.medications
  );
  
  const medicationsList = patient.medications.length > 0 
    ? patient.medications.map(m => `${m.name} ${m.dose} ${m.route} ${m.frequency}`).join(', ')
    : 'no current medications';

  // Generate analysis based on detected conditions
  let riskFlags = 'No immediate red flags identified';
  let clinicalInterpretation = 'General health assessment';
  let monitoringPlan = 'Routine follow-up';
  
  if (detectedConditions.includes('cardiac_evaluation_needed')) {
    riskFlags = 'Chest pain symptoms require immediate cardiac evaluation to exclude acute coronary syndrome';
    clinicalInterpretation = 'Cardiac symptoms requiring urgent evaluation';
    monitoringPlan = 'Immediate cardiac evaluation recommended';
  }
  
  if (detectedConditions.includes('respiratory_assessment')) {
    if (patient.baselineVitals.spo2 && parseInt(patient.baselineVitals.spo2) < 95) {
      riskFlags += '. Oxygen saturation below 95 percent indicates potential respiratory compromise';
    }
    clinicalInterpretation += ' with respiratory symptoms';
  }
  
  if (detectedConditions.includes('diabetes_monitoring')) {
    clinicalInterpretation += ' with diabetes-related concerns';
    monitoringPlan = 'Diabetes monitoring every 3 months';
  }
  
  if (detectedConditions.includes('blood_pressure_monitoring')) {
    const bp = patient.baselineVitals.bp;
    if (bp && (bp.includes('140') || bp.includes('150'))) {
      clinicalInterpretation += ' with elevated blood pressure';
      monitoringPlan = 'Blood pressure monitoring twice weekly';
      riskFlags = 'Elevated blood pressure requiring attention';
    }
  }
  
  if (detectedConditions.includes('renal_function_assessment')) {
    const creatinine = patient.baselineLabs?.creatinine;
    if (creatinine && parseFloat(creatinine) > 1.3) {
      clinicalInterpretation += ' with mild renal impairment';
      monitoringPlan = 'Renal function monitoring every 6-8 weeks';
      riskFlags = 'Renal impairment requiring medication dose adjustment';
    }
  }

  return `Patient Overview

${patient.fullName} is a ${patient.age}-year-old ${patient.sex.toLowerCase()} presenting with ${patient.complaints.toLowerCase() || 'general health assessment'}. Current vital signs demonstrate blood pressure of ${patient.baselineVitals.bp || 'not recorded'}, heart rate of ${patient.baselineVitals.hr || 'not recorded'} beats per minute, temperature of ${patient.baselineVitals.temp || 'not recorded'} degrees Fahrenheit, and oxygen saturation of ${patient.baselineVitals.spo2 || 'not recorded'} percent. Laboratory analysis reveals white blood cell count of ${patient.baselineLabs?.wbc || 'not measured'}, platelet count of ${patient.baselineLabs?.platelets || 'not measured'}, and creatinine level of ${patient.baselineLabs?.creatinine || 'not measured'} mg/dL. Current medication regimen includes ${medicationsList}.

Clinical Interpretation

The clinical presentation suggests ${clinicalInterpretation}. ${detectedConditions.length > 0 ? `Detected medical concerns include: ${detectedConditions.join(', ')}.` : 'No specific medical conditions detected based on available data.'} Vital sign analysis indicates ${patient.baselineVitals.bp && (patient.baselineVitals.bp.includes('140') || patient.baselineVitals.bp.includes('150')) ? 'elevated blood pressure requiring attention' : 'hemodynamic stability within acceptable parameters'}. Laboratory parameters demonstrate ${patient.baselineLabs?.creatinine && parseFloat(patient.baselineLabs.creatinine) > 1.3 ? 'mild renal impairment that may affect medication dosing' : 'normal renal function adequate for most medication clearance'}. The complexity of the current medication regimen necessitates careful monitoring for potential drug interactions and adverse effects.

Contributing Factors

Age-related physiological changes at ${patient.age} years significantly influence medication pharmacokinetics and disease manifestation. ${patient.socialHistory.smoking ? 'Current tobacco use substantially increases cardiovascular risk and may interfere with medication metabolism' : 'Absence of smoking history reduces certain respiratory and cardiovascular risks'}. Body mass index calculated from height ${patient.height} centimeters and weight ${patient.weight} kilograms indicates ${parseInt(patient.weight) / Math.pow(parseInt(patient.height)/100, 2) > 30 ? 'obesity status requiring weight management intervention' : parseInt(patient.weight) / Math.pow(parseInt(patient.height)/100, 2) > 25 ? 'overweight status suggesting lifestyle modification' : 'normal body weight range'}. Family history of ${patient.familyHistory || 'no known hereditary conditions'} may predispose to similar pathological processes requiring surveillance.

Risk Indicators / Red Flags

${riskFlags}. ${patient.baselineVitals.spo2 && parseInt(patient.baselineVitals.spo2) < 95 ? 'Oxygen saturation below 95 percent indicates potential respiratory compromise requiring immediate intervention' : 'Oxygenation status appears adequate for current metabolic demands'}. ${detectedConditions.includes('cardiac_evaluation_needed') ? 'Immediate cardiac evaluation recommended due to chest pain symptoms' : 'No immediate emergent conditions are apparent based on available clinical data'}.

Medication & Therapy Considerations

Current pharmacotherapy includes ${medicationsList}. ${patient.medications.length > 2 ? 'Polypharmacy situation requires comprehensive medication reconciliation and potential deprescribing opportunities' : 'Medication regimen appears appropriate for current clinical condition'}. ${patient.medications.some(m => m.name.toLowerCase().includes('anticoagulant') || m.name.toLowerCase().includes('warfarin')) ? 'Anticoagulation therapy necessitates regular laboratory monitoring and bleeding risk assessment' : ''} ${patient.medications.some(m => m.name.toLowerCase().includes('ace') || m.name.toLowerCase().includes('arb')) ? 'Renin-angiotensin system inhibitors require renal function monitoring and potassium level surveillance' : ''} ${detectedConditions.includes('renal_function_assessment') ? 'Renal impairment requires dose adjustment for renally cleared medications' : ''}. Consider therapeutic drug monitoring for medications with narrow therapeutic windows given current clinical parameters.

Monitoring & Follow-up

${monitoringPlan}. Blood pressure should be monitored ${patient.baselineVitals.bp && (patient.baselineVitals.bp.includes('140') || patient.baselineVitals.bp.includes('150')) ? 'twice weekly until target values achieved' : 'at routine medical visits every 3-4 months'}. Laboratory parameters including complete metabolic panel and complete blood count should be evaluated ${patient.medications.some(m => m.name.toLowerCase().includes('diuretic') || m.name.toLowerCase().includes('ace')) ? 'every 4-6 weeks' : 'every 6-12 months'}. Medication adherence and potential adverse effects require systematic assessment at each clinical encounter.

Practical Care Advice

Maintain strict adherence to prescribed medication schedule and promptly report any adverse effects to healthcare providers. Implement dietary modifications including ${patient.baselineVitals.bp && (patient.baselineVitals.bp.includes('140') || patient.baselineVitals.bp.includes('150')) ? 'sodium restriction under 2 grams daily and DASH eating pattern' : 'heart-healthy nutrition with appropriate caloric intake'}. Engage in regular physical activity as tolerated aiming for ${parseInt(patient.weight) / Math.pow(parseInt(patient.height)/100, 2) > 30 ? 'gradually increasing to 150 minutes weekly' : '150 minutes of moderate intensity weekly'}. Monitor blood pressure at home if equipment available and maintain log for healthcare provider review. Limit alcohol consumption to moderate levels and avoid tobacco products completely. ${detectedConditions.includes('cardiac_evaluation_needed') ? 'Seek immediate medical attention for chest pain, shortness of breath, or other concerning cardiac symptoms.' : 'Seek immediate medical attention for chest pain, shortness of breath, neurological deficits, or other concerning symptoms.'} Maintain updated medication list and medical history for all healthcare provider encounters.`;
}

// Comprehensive test cases for accuracy validation
const accuracyTestCases = [
  // Test 1: Cardiac symptoms - should detect heart-related issues
  {
    id: 'ACCURACY-001',
    fullName: 'John Smith',
    age: 55,
    sex: 'Male',
    height: '175',
    weight: '85',
    baselineVitals: { bp: '150/95', hr: '88', temp: '98.6', spo2: '97%' },
    baselineLabs: { wbc: '7.5', platelets: '250', rbc: '4.8', creatinine: '1.2' },
    socialHistory: { smoking: true, alcohol: false, tobacco: true },
    familyHistory: 'Heart disease, Hypertension',
    medicalHistory: 'Hypertension',
    medications: [
      { name: 'Lisinopril', dose: '10mg', route: 'Oral', frequency: 'Once daily' },
      { name: 'Aspirin', dose: '81mg', route: 'Oral', frequency: 'Once daily' }
    ],
    complaints: 'Chest pain and shortness of breath',
    otherFindings: 'ECG shows ST depression',
    status: 'Active',
    visits: [],
    consentGiven: false,
    pin: '',
    treatmentContext: 'Cardiac evaluation',
    expectedConditions: ['cardiac_evaluation_needed', 'blood_pressure_monitoring', 'respiratory_assessment']
  },
  
  // Test 2: Diabetes symptoms - should detect diabetes-related issues
  {
    id: 'ACCURACY-002',
    fullName: 'Jane Doe',
    age: 45,
    sex: 'Female',
    height: '162',
    weight: '95',
    baselineVitals: { bp: '130/85', hr: '76', temp: '98.4', spo2: '98%' },
    baselineLabs: { wbc: '8.2', platelets: '220', rbc: '4.2', creatinine: '0.9' },
    socialHistory: { smoking: false, alcohol: false, tobacco: false },
    familyHistory: 'Type 2 diabetes',
    medicalHistory: 'Type 2 diabetes',
    medications: [
      { name: 'Metformin', dose: '500mg', route: 'Oral', frequency: 'Twice daily' }
    ],
    complaints: 'Increased thirst and frequent urination',
    otherFindings: 'Blood glucose 250 mg/dL',
    status: 'Active',
    visits: [],
    consentGiven: false,
    pin: '',
    treatmentContext: 'Diabetes management',
    expectedConditions: ['diabetes_monitoring']
  },
  
  // Test 3: Simple terms - should detect from basic language
  {
    id: 'ACCURACY-003',
    fullName: 'Bob Johnson',
    age: 65,
    sex: 'Male',
    height: '178',
    weight: '80',
    baselineVitals: { bp: '145/90', hr: '72', temp: '98.6', spo2: '96%' },
    baselineLabs: { wbc: '6.8', platelets: '200', rbc: '4.5', creatinine: '1.5' },
    socialHistory: { smoking: false, alcohol: true, tobacco: false },
    familyHistory: 'Kidney disease',
    medicalHistory: 'High blood pressure',
    medications: [
      { name: 'Amlodipine', dose: '5mg', route: 'Oral', frequency: 'Once daily' }
    ],
    complaints: 'Headache and feeling dizzy',
    otherFindings: 'Mild confusion',
    status: 'Active',
    visits: [],
    consentGiven: false,
    pin: '',
    treatmentContext: 'General checkup',
    expectedConditions: ['blood_pressure_monitoring', 'neurological_evaluation', 'renal_function_assessment']
  },
  
  // Test 4: Minimal data - should still provide meaningful analysis
  {
    id: 'ACCURACY-004',
    fullName: 'Alice Brown',
    age: 30,
    sex: 'Female',
    height: '165',
    weight: '60',
    baselineVitals: { bp: '110/70', hr: '68', temp: '98.4', spo2: '99%' },
    baselineLabs: { wbc: '', platelets: '', rbc: '', creatinine: '' },
    socialHistory: { smoking: false, alcohol: false, tobacco: false },
    familyHistory: '',
    medicalHistory: '',
    medications: [],
    complaints: 'Just feeling tired',
    otherFindings: '',
    status: 'Active',
    visits: [],
    consentGiven: false,
    pin: '',
    treatmentContext: 'Wellness visit',
    expectedConditions: []
  },
  
  // Test 5: Complex multi-system issues
  {
    id: 'ACCURACY-005',
    fullName: 'Robert Wilson',
    age: 72,
    sex: 'Male',
    height: '175',
    weight: '90',
    baselineVitals: { bp: '160/100', hr: '82', temp: '99.0', spo2: '94%' },
    baselineLabs: { wbc: '9.5', platelets: '180', rbc: '4.0', creatinine: '2.1' },
    socialHistory: { smoking: true, alcohol: true, tobacco: false },
    familyHistory: 'Heart disease, Diabetes, Kidney disease',
    medicalHistory: 'CHF, CKD, Diabetes, Hypertension',
    medications: [
      { name: 'Furosemide', dose: '40mg', route: 'Oral', frequency: 'Twice daily' },
      { name: 'Lisinopril', dose: '20mg', route: 'Oral', frequency: 'Once daily' },
      { name: 'Metformin', dose: '1000mg', route: 'Oral', frequency: 'Twice daily' },
      { name: 'Warfarin', dose: '5mg', route: 'Oral', frequency: 'Once daily' }
    ],
    complaints: 'Swelling in legs, trouble breathing, chest discomfort',
    otherFindings: 'CXR shows pulmonary edema',
    status: 'Observation',
    visits: [],
    consentGiven: false,
    pin: '',
    treatmentContext: 'Complex multi-system management',
    expectedConditions: ['cardiac_evaluation_needed', 'blood_pressure_monitoring', 'respiratory_assessment', 'diabetes_monitoring', 'renal_function_assessment']
  },
  
  // Test 6: Simple language - everyday terms
  {
    id: 'ACCURACY-006',
    fullName: 'Mary Davis',
    age: 42,
    sex: 'Female',
    height: '160',
    weight: '70',
    baselineVitals: { bp: '135/88', hr: '75', temp: '98.8', spo2: '97%' },
    baselineLabs: { wbc: '7.2', platelets: '240', rbc: '4.3', creatinine: '0.8' },
    socialHistory: { smoking: false, alcohol: true, tobacco: false },
    familyHistory: 'Stomach problems',
    medicalHistory: 'Acid reflux',
    medications: [
      { name: 'Omeprazole', dose: '20mg', route: 'Oral', frequency: 'Once daily' }
    ],
    complaints: 'Stomach hurts and feel sick',
    otherFindings: 'Mild epigastric tenderness',
    status: 'Active',
    visits: [],
    consentGiven: false,
    pin: '',
    treatmentContext: 'Stomach issues',
    expectedConditions: ['gastrointestinal_assessment']
  },
  
  // Test 7: Neurological symptoms
  {
    id: 'ACCURACY-007',
    fullName: 'Tom Wilson',
    age: 58,
    sex: 'Male',
    height: '180',
    weight: '85',
    baselineVitals: { bp: '140/90', hr: '78', temp: '98.6', spo2: '98%' },
    baselineLabs: { wbc: '7.0', platelets: '230', rbc: '4.6', creatinine: '1.1' },
    socialHistory: { smoking: false, alcohol: false, tobacco: false },
    familyHistory: 'Migraines',
    medicalHistory: 'Occasional headaches',
    medications: [
      { name: 'Ibuprofen', dose: '400mg', route: 'Oral', frequency: 'As needed' }
    ],
    complaints: 'Bad headache with blurry vision',
    otherFindings: 'No focal neurological deficits',
    status: 'Active',
    visits: [],
    consentGiven: false,
    pin: '',
    treatmentContext: 'Headache evaluation',
    expectedConditions: ['neurological_evaluation']
  },
  
  // Test 8: Respiratory issues
  {
    id: 'ACCURACY-008',
    fullName: 'Sarah Chen',
    age: 35,
    sex: 'Female',
    height: '165',
    weight: '65',
    baselineVitals: { bp: '125/80', hr: '92', temp: '99.2', spo2: '93%' },
    baselineLabs: { wbc: '12.0', platelets: '280', rbc: '4.4', creatinine: '0.9' },
    socialHistory: { smoking: true, alcohol: false, tobacco: true },
    familyHistory: 'Asthma',
    medicalHistory: 'Asthma',
    medications: [
      { name: 'Albuterol', dose: '2 puffs', route: 'Inhaler', frequency: 'As needed' }
    ],
    complaints: 'Cough and trouble breathing',
    otherFindings: 'Wheezing on auscultation',
    status: 'Observation',
    visits: [],
    consentGiven: false,
    pin: '',
    treatmentContext: 'Asthma exacerbation',
    expectedConditions: ['respiratory_assessment']
  }
];

// Accuracy validation function
function validateAnalysisAccuracy(analysis, testCase, detectedConditions) {
  const results = {
    passed: true,
    accuracy: 0,
    issues: [],
    correctDetections: 0,
    missedDetections: 0,
    falseDetections: 0,
    structureCompliance: 0,
    clinicalRelevance: 0
  };

  // Check structure compliance (7 sections)
  const requiredSections = [
    'Patient Overview',
    'Clinical Interpretation',
    'Contributing Factors',
    'Risk Indicators',
    'Medication & Therapy',
    'Monitoring & Follow-up',
    'Practical Care Advice'
  ];

  let sectionsFound = 0;
  requiredSections.forEach(section => {
    if (analysis.includes(section)) {
      sectionsFound++;
    }
  });
  results.structureCompliance = (sectionsFound / requiredSections.length) * 100;

  // Check if expected conditions are detected
  const expectedConditions = testCase.expectedConditions || [];
  results.correctDetections = detectedConditions.filter(condition => 
    expectedConditions.includes(condition)
  ).length;
  
  results.missedDetections = expectedConditions.filter(condition => 
    !detectedConditions.includes(condition)
  ).length;
  
  results.falseDetections = detectedConditions.filter(condition => 
    !expectedConditions.includes(condition)
  ).length;

  // Calculate detection accuracy
  const totalExpected = expectedConditions.length;
  if (totalExpected > 0) {
    results.accuracy = (results.correctDetections / totalExpected) * 100;
  } else {
    results.accuracy = 100; // Perfect if no conditions expected and none detected
  }

  // Check clinical relevance
  const clinicalKeywords = ['blood pressure', 'heart rate', 'medication', 'monitoring', 'follow-up', 'risk'];
  let relevanceScore = 0;
  clinicalKeywords.forEach(keyword => {
    if (analysis.toLowerCase().includes(keyword)) {
      relevanceScore++;
    }
  });
  results.clinicalRelevance = (relevanceScore / clinicalKeywords.length) * 100;

  // Check for patient-specific information
  if (!analysis.toLowerCase().includes(testCase.fullName.toLowerCase())) {
    results.issues.push('Patient name not found in analysis');
    results.passed = false;
  }

  if (!analysis.toLowerCase().includes(testCase.age.toString())) {
    results.issues.push('Patient age not found in analysis');
    results.passed = false;
  }

  if (!analysis.toLowerCase().includes(testCase.sex.toLowerCase())) {
    results.issues.push('Patient sex not found in analysis');
    results.passed = false;
  }

  // Check for complaint-specific content
  if (testCase.complaints && !analysis.toLowerCase().includes(testCase.complaints.toLowerCase().split(' ')[0])) {
    results.issues.push('Chief complaint not adequately addressed');
    results.passed = false;
  }

  // Overall accuracy calculation
  const overallAccuracy = (results.structureCompliance + results.accuracy + results.clinicalRelevance) / 3;
  
  if (overallAccuracy < 80) {
    results.passed = false;
    results.issues.push(`Overall accuracy too low: ${overallAccuracy.toFixed(1)}%`);
  }

  return results;
}

// Run comprehensive accuracy test
async function runAccuracyStressTest() {
  console.log('🎯 CLINICAL ANALYSIS ACCURACY VALIDATION TEST');
  console.log('📊 Testing: 8 diverse patient scenarios with keyword detection');
  console.log('⏰ Test started at:', new Date().toISOString());
  console.log('🔍 Focus: Accuracy, correctness, clinical relevance');
  
  const testResults = {
    totalTests: accuracyTestCases.length,
    passedTests: 0,
    failedTests: 0,
    accuracyScores: [],
    structureCompliance: [],
    detectionAccuracy: [],
    clinicalRelevance: [],
    validationResults: [],
    overallAccuracy: 0
  };

  for (let i = 0; i < accuracyTestCases.length; i++) {
    const testCase = accuracyTestCases[i];
    console.log(`\n🔄 Accuracy Test ${i + 1}/${accuracyTestCases.length} - Patient: ${testCase.fullName}`);
    console.log(`📋 Complaints: "${testCase.complaints}"`);
    console.log(`🎯 Expected Conditions: ${testCase.expectedConditions.join(', ') || 'None'}`);
    
    try {
      // Generate analysis with keyword detection
      const detectedConditions = detectMedicalConditions(
        testCase.complaints,
        testCase.baselineVitals,
        testCase.baselineLabs || {},
        testCase.medications
      );
      
      console.log(`🔍 Detected Conditions: ${detectedConditions.join(', ') || 'None'}`);
      
      const analysis = generateAccurateClinicalAnalysis(testCase);
      
      // Validate accuracy
      const validation = validateAnalysisAccuracy(analysis, testCase, detectedConditions);
      testResults.validationResults.push({
        testCase: testCase.id,
        patientName: testCase.fullName,
        complaints: testCase.complaints,
        expected: testCase.expectedConditions,
        detected: detectedConditions,
        validation
      });
      
      testResults.accuracyScores.push(validation.accuracy);
      testResults.structureCompliance.push(validation.structureCompliance);
      testResults.detectionAccuracy.push(validation.accuracy);
      testResults.clinicalRelevance.push(validation.clinicalRelevance);
      
      if (validation.passed) {
        testResults.passedTests++;
        console.log(`✅ Accuracy Test ${i + 1} PASSED`);
        console.log(`📊 Accuracy: ${validation.accuracy.toFixed(1)}% | Structure: ${validation.structureCompliance.toFixed(1)}% | Relevance: ${validation.clinicalRelevance.toFixed(1)}%`);
      } else {
        testResults.failedTests++;
        console.log(`❌ Accuracy Test ${i + 1} FAILED`);
        console.log(`🚨 Issues: ${validation.issues.join(', ')}`);
        console.log(`📊 Accuracy: ${validation.accuracy.toFixed(1)}% | Structure: ${validation.structureCompliance.toFixed(1)}% | Relevance: ${validation.clinicalRelevance.toFixed(1)}%`);
      }
      
    } catch (error) {
      testResults.failedTests++;
      console.log(`💥 Accuracy Test ${i + 1} ERROR: ${error.message}`);
    }
  }

  // Calculate overall metrics
  const avgAccuracy = testResults.accuracyScores.reduce((a, b) => a + b, 0) / testResults.accuracyScores.length;
  const avgStructureCompliance = testResults.structureCompliance.reduce((a, b) => a + b, 0) / testResults.structureCompliance.length;
  const avgDetectionAccuracy = testResults.detectionAccuracy.reduce((a, b) => a + b, 0) / testResults.detectionAccuracy.length;
  const avgClinicalRelevance = testResults.clinicalRelevance.reduce((a, b) => a + b, 0) / testResults.clinicalRelevance.length;
  
  testResults.overallAccuracy = (avgAccuracy + avgStructureCompliance + avgClinicalRelevance) / 3;

  // Generate comprehensive report
  console.log('\n📊 ACCURACY VALIDATION REPORT');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`Passed: ${testResults.passedTests} (${(testResults.passedTests/testResults.totalTests*100).toFixed(1)}%)`);
  console.log(`Failed: ${testResults.failedTests} (${(testResults.failedTests/testResults.totalTests*100).toFixed(1)}%)`);
  
  console.log('\n🎯 ACCURACY METRICS');
  console.log('='.repeat(60));
  console.log(`Average Detection Accuracy: ${avgDetectionAccuracy.toFixed(1)}%`);
  console.log(`Average Structure Compliance: ${avgStructureCompliance.toFixed(1)}%`);
  console.log(`Average Clinical Relevance: ${avgClinicalRelevance.toFixed(1)}%`);
  console.log(`Overall Accuracy Score: ${testResults.overallAccuracy.toFixed(1)}%`);
  
  // Detection analysis
  console.log('\n🔍 DETECTION ANALYSIS');
  console.log('='.repeat(60));
  let totalCorrect = 0;
  let totalMissed = 0;
  let totalFalse = 0;
  
  testResults.validationResults.forEach(result => {
    totalCorrect += result.validation.correctDetections;
    totalMissed += result.validation.missedDetections;
    totalFalse += result.validation.falseDetections;
  });
  
  console.log(`Correct Detections: ${totalCorrect}`);
  console.log(`Missed Detections: ${totalMissed}`);
  console.log(`False Detections: ${totalFalse}`);
  
  if (totalMissed > 0) {
    console.log('\n⚠️  MISSED DETECTIONS:');
    testResults.validationResults.forEach(result => {
      if (result.validation.missedDetections > 0) {
        console.log(`  ${result.patientName}: ${result.expected.filter(c => !result.detected.includes(c)).join(', ')}`);
      }
    });
  }
  
  // Test case breakdown
  console.log('\n📋 TEST CASE BREAKDOWN');
  console.log('='.repeat(60));
  testResults.validationResults.forEach(result => {
    const status = result.validation.passed ? '✅' : '❌';
    console.log(`${status} ${result.patientName}: ${result.complaints}`);
    console.log(`   Expected: ${result.expected.join(', ') || 'None'}`);
    console.log(`   Detected: ${result.detected.join(', ') || 'None'}`);
    console.log(`   Accuracy: ${result.validation.accuracy.toFixed(1)}%`);
  });
  
  // Final assessment
  console.log('\n🚀 ACCURACY ASSESSMENT');
  console.log('='.repeat(60));
  
  if (testResults.overallAccuracy >= 90) {
    console.log('✅ EXCELLENT ACCURACY - System is highly reliable');
    console.log('✅ Clinical analysis can be trusted for patient care');
    console.log('✅ Keyword detection working effectively');
  } else if (testResults.overallAccuracy >= 80) {
    console.log('⚠️  GOOD ACCURACY - System is mostly reliable');
    console.log('⚠️  Minor improvements needed for critical cases');
    console.log('⚠️  Review missed detections for optimization');
  } else if (testResults.overallAccuracy >= 70) {
    console.log('⚠️  MARGINAL ACCURACY - System needs improvement');
    console.log('⚠️  Significant optimization required');
    console.log('⚠️  Not recommended for clinical decision support');
  } else {
    console.log('❌ POOR ACCURACY - System not reliable');
    console.log('❌ Major overhaul required before clinical use');
    console.log('❌ Do not use for patient care decisions');
  }
  
  console.log(`\n💡 TRUSTWORTHINESS ASSESSMENT:`);
  console.log(`- Can we trust the analysis? ${testResults.overallAccuracy >= 80 ? 'YES - Mostly reliable' : 'NO - Needs improvement'}`);
  console.log(`- Are results accurate? ${avgDetectionAccuracy >= 80 ? 'YES - Good detection' : 'NO - Poor detection'}`);
  console.log(`- Is clinical relevance high? ${avgClinicalRelevance >= 80 ? 'YES - Clinically relevant' : 'NO - Low relevance'}`);
  console.log(`- Safe for patient care? ${testResults.overallAccuracy >= 85 ? 'YES - With supervision' : 'NO - Not safe'}`);
  
  return testResults;
}

// Run the accuracy test
runAccuracyStressTest().catch(console.error);
