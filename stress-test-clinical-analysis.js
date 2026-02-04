// Stress Test for Clinical Analysis System
// Target: 200 cases per day (~20 cases/hour)
// Testing sequential calls to avoid rate limits

import { generateSafetyReport } from './services/geminiService.js';

// Test data templates for different patient scenarios
const testPatients = [
  // Normal case
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
  
  // Borderline case
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
  
  // Minimal data case
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
  },
  
  // Discharged patient revisit case
  {
    id: 'TEST-004-REVISIT',
    fullName: 'Alice Brown',
    age: 52,
    sex: 'Female',
    height: '168',
    weight: '72',
    baselineVitals: { bp: '130/85', hr: '76', temp: '98.4', spo2: '97%' },
    baselineLabs: { wbc: '6.8', platelets: '220', rbc: '4.5', creatinine: '0.9' },
    socialHistory: { smoking: false, alcohol: false, tobacco: false },
    familyHistory: 'Osteoporosis',
    medicalHistory: 'Post-surgical recovery',
    medications: [
      { name: 'Ibuprofen', dose: '400mg', route: 'Oral', frequency: 'As needed' },
      { name: 'Calcium supplement', dose: '600mg', route: 'Oral', frequency: 'Once daily' }
    ],
    complaints: 'Post-op pain improving, mild swelling',
    otherFindings: 'Surgical site healing well',
    status: 'Active',
    visits: [],
    consentGiven: false,
    pin: '',
    treatmentContext: 'Post-operative follow-up'
  },
  
  // Complex multi-medication case
  {
    id: 'TEST-005',
    fullName: 'Robert Wilson',
    age: 72,
    sex: 'Male',
    height: '178',
    weight: '85',
    baselineVitals: { bp: '160/100', hr: '82', temp: '98.8', spo2: '95%' },
    baselineLabs: { wbc: '8.5', platelets: '160', rbc: '4.0', creatinine: '1.8' },
    socialHistory: { smoking: true, alcohol: true, tobacco: false },
    familyHistory: 'Kidney disease, Heart failure',
    medicalHistory: 'CHF, CKD, AFib, Arthritis',
    medications: [
      { name: 'Furosemide', dose: '40mg', route: 'Oral', frequency: 'Twice daily' },
      { name: 'Lisinopril', dose: '20mg', route: 'Oral', frequency: 'Once daily' },
      { name: 'Warfarin', dose: '5mg', route: 'Oral', frequency: 'Once daily' },
      { name: 'Metoprolol', dose: '25mg', route: 'Oral', frequency: 'Twice daily' },
      { name: 'Aspirin', dose: '81mg', route: 'Oral', frequency: 'Once daily' }
    ],
    complaints: 'Shortness of breath, leg swelling, fatigue',
    otherFindings: 'CXR shows cardiomegaly, mild pulmonary congestion',
    status: 'Observation',
    visits: [],
    consentGiven: false,
    pin: '',
    treatmentContext: 'Complex medication management'
  }
];

// Validation function to check clinical analysis output
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

  // Check if output is empty
  if (!output || output.trim().length === 0) {
    results.isEmpty = true;
    results.passed = false;
    results.issues.push('Output is empty');
    return results;
  }

  // Check for refusal text
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

  // Check for AI identity references
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

  // Check for markdown symbols
  if (output.includes('##') || output.includes('**') || output.includes('*')) {
    results.hasMarkdown = true;
    results.passed = false;
    results.issues.push('Found markdown symbols');
  }

  // Check for required sections
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

  // Run 20 sequential tests with varied patient data
  for (let i = 0; i < 20; i++) {
    const patientCase = testPatients[i % testPatients.length];
    const callStartTime = Date.now();
    
    console.log(`\n🔄 Test ${i + 1}/20 - Patient: ${patientCase.fullName} (${patientCase.id})`);
    
    try {
      // Call the clinical analysis function
      const analysisResult = await generateSafetyReport(patientCase);
      const responseTime = Date.now() - callStartTime;
      
      testResults.responseTimes.push(responseTime);
      
      // Validate the output
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
    
    // Small delay between calls to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Calculate statistics
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
  
  // Generate report
  console.log('\n📊 STRESS TEST REPORT');
  console.log('='.repeat(50));
  console.log(`Total Calls: ${testResults.totalCalls}`);
  console.log(`Successful: ${testResults.successfulCalls} (${(testResults.successfulCalls/testResults.totalCalls*100).toFixed(1)}%)`);
  console.log(`Failed: ${testResults.failedCalls} (${(testResults.failedCalls/testResults.totalCalls*100).toFixed(1)}%)`);
  console.log(`Total Time: ${totalTime}ms (${(totalTime/1000).toFixed(1)}s)`);
  console.log(`Average Response Time: ${avgResponseTime.toFixed(1)}ms`);
  console.log(`Min Response Time: ${minResponseTime}ms`);
  console.log(`Max Response Time: ${maxResponseTime}ms`);
  
  // Analyze validation results
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
  
  if (validationIssues.missingSections.length > 0) {
    const sectionCounts = {};
    validationIssues.missingSections.forEach(section => {
      sectionCounts[section] = (sectionCounts[section] || 0) + 1;
    });
    console.log('Missing Sections Breakdown:');
    Object.entries(sectionCounts).forEach(([section, count]) => {
      console.log(`  ${section}: ${count} times`);
    });
  }
  
  // System stability assessment
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
  
  // Rate limiting assessment
  if (testResults.errors.some(e => e.error.includes('quota') || e.error.includes('rate'))) {
    console.log('⚠️  RATE LIMITING DETECTED - Implement backoff strategy');
  } else {
    console.log('✅ No rate limiting issues detected');
  }
  
  return testResults;
}

// Run the stress test
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runStressTest, validateClinicalAnalysis, testPatients };
} else {
  // Run directly if called as script
  runStressTest().catch(console.error);
}
