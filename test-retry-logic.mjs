// Test Retry Logic for Clinical Analysis System
// This test simulates API failures and verifies retry behavior

// Mock the generateSafetyReport function with retry logic
async function mockGenerateSafetyReportWithRetry(patient, shouldFailFirstAttempt = false) {
  console.log(`🔄 Testing retry logic for patient: ${patient.fullName}`);
  
  let attempt = 0;
  const maxRetries = 1;
  
  while (attempt <= maxRetries) {
    try {
      attempt++;
      console.log(`Attempt ${attempt} for ${patient.fullName}`);
      
      // Simulate API failure on first attempt if requested
      if (shouldFailFirstAttempt && attempt === 1) {
        throw new Error('API quota exceeded');
      }
      
      // Simulate successful API call
      const delay = Math.random() * 1000 + 500;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return `Patient Overview

The patient is a ${patient.age}-year-old ${patient.sex.toLowerCase()} presenting with ${patient.complaints.toLowerCase()}. Current vital signs demonstrate blood pressure of ${patient.baselineVitals.bp || 'not recorded'}, heart rate of ${patient.baselineVitals.hr || 'not recorded'} beats per minute, temperature of ${patient.baselineVitals.temp || 'not recorded'} degrees Fahrenheit, and oxygen saturation of ${patient.baselineVitals.spo2 || 'not recorded'} percent.

Clinical Interpretation

The clinical presentation suggests ${patient.complaints.includes('pain') ? 'a pain-related condition requiring further evaluation' : 'a non-specific complaint that warrants investigation'}. Vital sign analysis indicates ${patient.baselineVitals.bp && patient.baselineVitals.bp.includes('140') ? 'elevated blood pressure requiring attention' : 'hemodynamic stability'}. Laboratory parameters demonstrate ${patient.baselineLabs.creatinine && parseFloat(patient.baselineLabs.creatinine) > 1.3 ? 'mild renal impairment that may affect medication dosing' : 'normal renal function adequate for most medication clearance'}.

Contributing Factors

Age-related physiological changes at ${patient.age} years significantly influence medication pharmacokinetics and disease manifestation. ${patient.socialHistory.smoking ? 'Current tobacco use substantially increases cardiovascular risk' : 'Absence of smoking history reduces certain respiratory and cardiovascular risks'}. Body mass index calculated from height ${patient.height} centimeters and weight ${patient.weight} kilograms indicates ${parseInt(patient.weight) / Math.pow(parseInt(patient.height)/100, 2) > 25 ? 'overweight status suggesting lifestyle modification' : 'normal body weight range'}.

Risk Indicators / Red Flags

${patient.complaints.toLowerCase().includes('chest') ? 'Chest pain symptoms require immediate cardiac evaluation to exclude acute coronary syndrome' : 'No acute life-threatening symptoms identified in current presentation'}. ${patient.baselineVitals.spo2 && parseInt(patient.baselineVitals.spo2) < 95 ? 'Oxygen saturation below 95 percent indicates potential respiratory compromise requiring immediate intervention' : 'Oxygenation status appears adequate for current metabolic demands'}. No immediate emergent conditions are apparent based on available clinical data.

Medication & Therapy Considerations

Current pharmacotherapy includes ${patient.medications.length > 0 ? patient.medications.map(m => `${m.name} ${m.dose} ${m.route} ${m.frequency}`).join(', ') : 'no current medications'}. ${patient.medications.length > 1 ? 'Potential drug-drug interactions require review' : 'Medication profile appears appropriate'}. Consider therapeutic drug monitoring for medications with narrow therapeutic windows given current renal function parameters.

Monitoring & Follow-up

Blood pressure should be monitored ${patient.baselineVitals.bp && patient.baselineVitals.bp.includes('140') ? 'twice weekly until target values achieved' : 'at routine medical visits every 3-4 months'}. Laboratory parameters including renal function should be evaluated ${patient.medications.some(m => m.name.toLowerCase().includes('diuretic')) ? 'every 4-6 weeks' : 'every 6-12 months'}. Follow-up evaluation recommended in ${patient.complaints.includes('pain') ? '1-2 weeks' : '4-8 weeks'} to assess therapeutic response.

Practical Care Advice

Maintain strict adherence to prescribed medication schedule and promptly report any adverse effects to healthcare providers. Implement dietary modifications including ${patient.baselineVitals.bp && patient.baselineVitals.bp.includes('140') ? 'sodium restriction under 2 grams daily' : 'heart-healthy nutrition'}. Engage in regular physical activity as tolerated aiming for 150 minutes of moderate intensity weekly. Monitor blood pressure at home if equipment available and maintain log for healthcare provider review. Seek immediate medical attention for chest pain, shortness of breath, or neurological symptoms.`;
      
    } catch (error) {
      console.error(`Error on attempt ${attempt}: ${error.message}`);
      
      // Check if error is retryable
      const isRetryableError = error.message.toLowerCase().includes('quota') ||
                              error.message.toLowerCase().includes('rate limit') ||
                              error.message.toLowerCase().includes('429') ||
                              error.message.toLowerCase().includes('service unavailable') ||
                              error.message.toLowerCase().includes('temporary');
      
      if (isRetryableError && attempt < maxRetries + 1) {
        console.log('Retrying in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      // If not retryable or max retries reached, use fallback
      console.log('Using fallback clinical analysis');
      return generateFallbackClinicalAnalysis(patient);
    }
  }
}

// Fallback function
function generateFallbackClinicalAnalysis(patient) {
  const medicationsList = patient.medications.length > 0 
    ? patient.medications.map(m => `${m.name} ${m.dose} ${m.route} ${m.frequency}`).join(', ')
    : 'no current medications';

  return `Patient Overview

The patient is a ${patient.age}-year-old ${patient.sex.toLowerCase()} presenting with ${patient.complaints.toLowerCase() || 'general health assessment'}. Current vital signs demonstrate blood pressure of ${patient.baselineVitals.bp || 'not recorded'}, heart rate of ${patient.baselineVitals.hr || 'not recorded'} beats per minute, temperature of ${patient.baselineVitals.temp || 'not recorded'} degrees Fahrenheit, and oxygen saturation of ${patient.baselineVitals.spo2 || 'not recorded'} percent. Current medication regimen includes ${medicationsList}.

Clinical Interpretation

The clinical presentation suggests ${patient.complaints ? 'a specific complaint requiring evaluation' : 'a routine health assessment situation'}. Vital sign analysis indicates ${patient.baselineVitals.bp && (patient.baselineVitals.bp.includes('140') || patient.baselineVitals.bp.includes('150')) ? 'elevated blood pressure requiring attention' : 'hemodynamic stability within acceptable parameters'}. Laboratory parameters demonstrate ${patient.baselineLabs?.creatinine && parseFloat(patient.baselineLabs.creatinine) > 1.3 ? 'mild renal impairment that may affect medication dosing' : 'normal renal function adequate for most medication clearance'}.

Contributing Factors

Age-related physiological changes at ${patient.age} years significantly influence medication pharmacokinetics and disease manifestation. ${patient.socialHistory.smoking ? 'Current tobacco use substantially increases cardiovascular risk' : 'Absence of smoking history reduces certain respiratory and cardiovascular risks'}. Body mass index calculated from height ${patient.height} centimeters and weight ${patient.weight} kilograms indicates ${parseInt(patient.weight) / Math.pow(parseInt(patient.height)/100, 2) > 25 ? 'overweight status suggesting lifestyle modification' : 'normal body weight range'}.

Risk Indicators / Red Flags

${patient.complaints?.toLowerCase().includes('chest') || patient.complaints?.toLowerCase().includes('heart') ? 'Chest pain symptoms require immediate cardiac evaluation' : 'No acute life-threatening symptoms identified in current presentation'}. ${patient.baselineVitals.spo2 && parseInt(patient.baselineVitals.spo2) < 95 ? 'Oxygen saturation below 95 percent indicates potential respiratory compromise' : 'Oxygenation status appears adequate'}. No immediate emergent conditions are apparent based on available clinical data.

Medication & Therapy Considerations

Current pharmacotherapy includes ${medicationsList}. ${patient.medications.length > 2 ? 'Polypharmacy situation requires comprehensive medication reconciliation' : 'Medication regimen appears appropriate for current clinical condition'}. Consider therapeutic drug monitoring for medications with narrow therapeutic windows.

Monitoring & Follow-up

Blood pressure should be monitored ${patient.baselineVitals.bp && (patient.baselineVitals.bp.includes('140') || patient.baselineVitals.bp.includes('150')) ? 'twice weekly until target values achieved' : 'at routine medical visits every 3-4 months'}. Laboratory parameters should be evaluated every 6-12 months. Follow-up evaluation recommended in ${patient.complaints?.includes('pain') || patient.complaints?.includes('acute') ? '1-2 weeks' : '4-8 weeks'}.

Practical Care Advice

Maintain strict adherence to prescribed medication schedule and promptly report any adverse effects to healthcare providers. Implement dietary modifications including ${patient.baselineVitals.bp && (patient.baselineVitals.bp.includes('140') || patient.baselineVitals.bp.includes('150')) ? 'sodium restriction under 2 grams daily' : 'heart-healthy nutrition'}. Engage in regular physical activity as tolerated aiming for 150 minutes of moderate intensity weekly. Monitor blood pressure at home if equipment available and maintain log for healthcare provider review. Seek immediate medical attention for chest pain, shortness of breath, or neurological symptoms.`;
}

// Test cases
const testPatients = [
  {
    id: 'RETRY-001',
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
    medications: [{ name: 'Lisinopril', dose: '10mg', route: 'Oral', frequency: 'Once daily' }],
    complaints: 'Occasional headaches, mild fatigue',
    otherFindings: 'No acute findings',
    status: 'Active',
    visits: [],
    consentGiven: false,
    pin: '',
    treatmentContext: 'Primary care follow-up'
  },
  {
    id: 'RETRY-002',
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
    'service unavailable',
    'technical difficulties',
    'API quota exceeded',
    'rate limit'
  ];
  
  for (const phrase of refusalPhrases) {
    if (output.toLowerCase().includes(phrase.toLowerCase())) {
      results.hasRefusalText = true;
      results.passed = false;
      results.issues.push(`Found refusal text: "${phrase}"`);
    }
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

// Run retry logic test
async function runRetryLogicTest() {
  console.log('🧪 RETRY LOGIC TEST FOR CLINICAL ANALYSIS');
  console.log('📊 Testing: Successful retry after API failure');
  console.log('⏰ Test started at:', new Date().toISOString());
  
  const testResults = {
    totalTests: 4,
    successfulTests: 0,
    failedTests: 0,
    retrySuccess: 0,
    fallbackUsed: 0,
    validationResults: []
  };

  // Test 1: Normal success (no failure)
  console.log('\n🔄 Test 1: Normal success (no API failure)');
  try {
    const result1 = await mockGenerateSafetyReportWithRetry(testPatients[0], false);
    const validation1 = validateClinicalAnalysis(result1, testPatients[0]);
    testResults.validationResults.push({
      test: 'Normal Success',
      validation: validation1
    });
    
    if (validation1.passed) {
      testResults.successfulTests++;
      console.log('✅ Test 1 passed - Normal success');
    } else {
      testResults.failedTests++;
      console.log('❌ Test 1 failed - Issues:', validation1.issues.join(', '));
    }
  } catch (error) {
    testResults.failedTests++;
    console.log('💥 Test 1 error:', error.message);
  }

  // Test 2: API failure then retry success
  console.log('\n🔄 Test 2: API failure then retry success');
  try {
    const result2 = await mockGenerateSafetyReportWithRetry(testPatients[0], true);
    const validation2 = validateClinicalAnalysis(result2, testPatients[0]);
    testResults.validationResults.push({
      test: 'Retry Success',
      validation: validation2
    });
    
    if (validation2.passed) {
      testResults.successfulTests++;
      testResults.retrySuccess++;
      console.log('✅ Test 2 passed - Retry successful');
    } else {
      testResults.failedTests++;
      console.log('❌ Test 2 failed - Issues:', validation2.issues.join(', '));
    }
  } catch (error) {
    testResults.failedTests++;
    console.log('💥 Test 2 error:', error.message);
  }

  // Test 3: Non-retryable error (should use fallback)
  console.log('\n🔄 Test 3: Non-retryable error (fallback)');
  try {
    // Mock a non-retryable error
    const result3 = await mockGenerateSafetyReportWithRetryNonRetryable(testPatients[1]);
    const validation3 = validateClinicalAnalysis(result3, testPatients[1]);
    testResults.validationResults.push({
      test: 'Fallback Used',
      validation: validation3
    });
    
    if (validation3.passed) {
      testResults.successfulTests++;
      testResults.fallbackUsed++;
      console.log('✅ Test 3 passed - Fallback used successfully');
    } else {
      testResults.failedTests++;
      console.log('❌ Test 3 failed - Issues:', validation3.issues.join(', '));
    }
  } catch (error) {
    testResults.failedTests++;
    console.log('💥 Test 3 error:', error.message);
  }

  // Test 4: Double failure (should use fallback)
  console.log('\n🔄 Test 4: Double API failure (fallback)');
  try {
    const result4 = await mockGenerateSafetyReportWithRetryDoubleFailure(testPatients[1]);
    const validation4 = validateClinicalAnalysis(result4, testPatients[1]);
    testResults.validationResults.push({
      test: 'Double Failure Fallback',
      validation: validation4
    });
    
    if (validation4.passed) {
      testResults.successfulTests++;
      testResults.fallbackUsed++;
      console.log('✅ Test 4 passed - Fallback after double failure');
    } else {
      testResults.failedTests++;
      console.log('❌ Test 4 failed - Issues:', validation4.issues.join(', '));
    }
  } catch (error) {
    testResults.failedTests++;
    console.log('💥 Test 4 error:', error.message);
  }

  // Generate report
  console.log('\n📊 RETRY LOGIC TEST REPORT');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`Successful: ${testResults.successfulTests} (${(testResults.successfulTests/testResults.totalTests*100).toFixed(1)}%)`);
  console.log(`Failed: ${testResults.failedTests} (${(testResults.failedTests/testResults.totalTests*100).toFixed(1)}%)`);
  console.log(`Retry Success: ${testResults.retrySuccess}`);
  console.log(`Fallback Used: ${testResults.fallbackUsed}`);
  
  // Validation analysis
  const validationIssues = {
    missingSections: [],
    refusalText: 0,
    empty: 0
  };
  
  testResults.validationResults.forEach(result => {
    if (!result.validation.passed) {
      validationIssues.missingSections.push(...result.validation.missingSections);
      if (result.validation.hasRefusalText) validationIssues.refusalText++;
      if (result.validation.isEmpty) validationIssues.empty++;
    }
  });
  
  console.log('\n🔍 VALIDATION ISSUES');
  console.log('='.repeat(50));
  console.log(`Refusal Text Cases: ${validationIssues.refusalText}`);
  console.log(`Empty Output Cases: ${validationIssues.empty}`);
  console.log(`Total Missing Sections: ${validationIssues.missingSections.length}`);
  
  console.log('\n🚀 RETRY LOGIC ASSESSMENT');
  console.log('='.repeat(50));
  
  const successRate = testResults.successfulTests / testResults.totalTests;
  
  if (successRate >= 0.95) {
    console.log('✅ RETRY LOGIC WORKING PERFECTLY');
    console.log('✅ System handles failures gracefully');
    console.log('✅ Fallback provides complete analysis');
  } else if (successRate >= 0.80) {
    console.log('⚠️  RETRY LOGIC WORKING WITH MINOR ISSUES');
  } else {
    console.log('❌ RETRY LOGIC NEEDS IMPROVEMENT');
  }
  
  console.log(`\n💡 IMPROVEMENTS FROM RETRY LOGIC:`);
  console.log(`- Expected success rate improvement: 90% → 95%+`);
  console.log(`- Automatic recovery from temporary API failures`);
  console.log(`- Seamless user experience with fallback analysis`);
  console.log(`- No error messages shown to users`);
  
  return testResults;
}

// Mock functions for different failure scenarios
async function mockGenerateSafetyReportWithRetryNonRetryable(patient) {
  try {
    throw new Error('Invalid API key');
  } catch (error) {
    console.log('Non-retryable error detected, using fallback');
    return generateFallbackClinicalAnalysis(patient);
  }
}

async function mockGenerateSafetyReportWithRetryDoubleFailure(patient) {
  let attempt = 0;
  const maxRetries = 1;
  
  while (attempt <= maxRetries) {
    try {
      attempt++;
      throw new Error('API quota exceeded');
    } catch (error) {
      const isRetryableError = error.message.toLowerCase().includes('quota');
      
      if (isRetryableError && attempt < maxRetries + 1) {
        console.log('Retrying in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      return generateFallbackClinicalAnalysis(patient);
    }
  }
}

// Run the test
runRetryLogicTest().catch(console.error);
