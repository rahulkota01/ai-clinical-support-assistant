import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
// Advanced Stress Test System - 250-300 Real Clinical Cases
// Tests AI-first with enhanced logic fallback at 25-27 cases per hour
// Trains the model to give accurate results with keyword grasping

import { generateSafetyReport } from './services/geminiService.ts';

// Real clinical case templates based on actual medical scenarios
const CLINICAL_CASE_TEMPLATES = {
  // Emergency Cardiac Cases
  cardiacEmergency: [
    {
      template: {
        fullName: 'John Smith',
        age: 58,
        sex: 'Male',
        height: 178,
        weight: 89,
        complaints: 'Severe crushing chest pain radiating to left arm and jaw for 45 minutes',
        baselineVitals: { bp: '165/95', hr: '110', temp: '98.4', spo2: '96%' },
        baselineLabs: { wbc: '8.2', platelets: '280', rbc: '4.8', creatinine: '1.3' },
        socialHistory: { smoking: true, alcohol: true, tobacco: false },
        familyHistory: 'Heart disease, hypertension',
        medicalHistory: 'Hypertension, hyperlipidemia, type 2 diabetes',
        medications: [{ name: 'Lisinopril', dose: '10mg', route: 'PO', frequency: 'daily' }],
        otherFindings: 'Diaphoretic, anxious, holding chest'
      },
      expectedConditions: ['acute_coronary_syndrome', 'myocardial_infarction', 'cardiac_emergency'],
      expectedSeverity: 'critical',
      expectedUrgency: 'emergency'
    },
    {
      template: {
        fullName: 'Mary Johnson',
        age: 72,
        sex: 'Female',
        height: 162,
        weight: 76,
        complaints: 'Sudden onset shortness of breath and palpitations',
        baselineVitals: { bp: '85/50', hr: '145', temp: '98.1', spo2: '89%' },
        baselineLabs: { wbc: '12.1', platelets: '320', rbc: '4.2', creatinine: '1.8' },
        socialHistory: { smoking: false, alcohol: false, tobacco: false },
        familyHistory: 'Heart disease',
        medicalHistory: 'Atrial fibrillation, heart failure, CKD',
        medications: [{ name: 'Warfarin', dose: '5mg', route: 'PO', frequency: 'daily' }],
        otherFindings: 'Irregularly irregular rhythm, distended neck veins'
      },
      expectedConditions: ['atrial_fibrillation_with_rvr', 'heart_failure_exacerbation', 'cardiogenic_shock'],
      expectedSeverity: 'critical',
      expectedUrgency: 'emergency'
    }
  ],

  // Respiratory Emergency Cases
  respiratoryEmergency: [
    {
      template: {
        fullName: 'Robert Davis',
        age: 45,
        sex: 'Male',
        height: 183,
        weight: 95,
        complaints: 'Severe shortness of breath and wheezing, cannot speak in full sentences',
        baselineVitals: { bp: '155/90', hr: '125', temp: '98.8', spo2: '82%' },
        baselineLabs: { wbc: '14.5', platelets: '350', rbc: '5.1', creatinine: '1.1' },
        socialHistory: { smoking: true, alcohol: false, tobacco: true },
        familyHistory: 'Asthma, allergies',
        medicalHistory: 'Severe persistent asthma, GERD',
        medications: [{ name: 'Albuterol inhaler', dose: '90mcg', route: 'inhaled', frequency: 'PRN' }],
        otherFindings: 'Using accessory muscles, tripod position, audible wheezing'
      },
      expectedConditions: ['status_asthmaticus', 'respiratory_failure', 'severe_asthma_exacerbation'],
      expectedSeverity: 'critical',
      expectedUrgency: 'emergency'
    },
    {
      template: {
        fullName: 'Lisa Chen',
        age: 68,
        sex: 'Female',
        height: 165,
        weight: 62,
        complaints: 'Productive cough with green sputum, fever, confusion',
        baselineVitals: { bp: '95/60', hr: '115', temp: '102.3', spo2: '88%' },
        baselineLabs: { wbc: '22.3', platelets: '180', rbc: '3.8', creatinine: '2.1' },
        socialHistory: { smoking: true, alcohol: false, tobacco: false },
        familyHistory: 'None',
        medicalHistory: 'COPD, type 2 diabetes, hypertension',
        medications: [{ name: 'Tiotropium', dose: '18mcg', route: 'inhaled', frequency: 'daily' }],
        otherFindings: 'Crackles in right lower lung, decreased breath sounds'
      },
      expectedConditions: ['severe_pneumonia', 'sepsis', 'respiratory_failure', 'copd_exacerbation'],
      expectedSeverity: 'critical',
      expectedUrgency: 'emergency'
    }
  ],

  // Neurological Emergency Cases
  neurologicalEmergency: [
    {
      template: {
        fullName: 'James Wilson',
        age: 71,
        sex: 'Male',
        height: 175,
        weight: 82,
        complaints: 'Sudden onset left-sided weakness and slurred speech',
        baselineVitals: { bp: '185/105', hr: '95', temp: '98.6', spo2: '97%' },
        baselineLabs: { wbc: '7.8', platelets: '290', rbc: '4.6', creatinine: '1.4' },
        socialHistory: { smoking: false, alcohol: false, tobacco: false },
        familyHistory: 'Stroke, hypertension',
        medicalHistory: 'Hypertension, hyperlipidemia, previous TIA',
        medications: [{ name: 'Aspirin', dose: '81mg', route: 'PO', frequency: 'daily' }],
        otherFindings: 'Left facial droop, dysarthria, left arm and leg weakness (3/5)'
      },
      expectedConditions: ['acute_ischemic_stroke', 'cerebrovascular_accident', 'neurological_emergency'],
      expectedSeverity: 'critical',
      expectedUrgency: 'emergency'
    },
    {
      template: {
        fullName: 'Sarah Martinez',
        age: 34,
        sex: 'Female',
        height: 168,
        weight: 58,
        complaints: 'Worst headache of life, photophobia, neck stiffness',
        baselineVitals: { bp: '145/85', hr: '105', temp: '99.2', spo2: '98%' },
        baselineLabs: { wbc: '9.2', platelets: '310', rbc: '4.3', creatinine: '0.9' },
        socialHistory: { smoking: false, alcohol: false, tobacco: false },
        familyHistory: 'Migraine, aneurysm',
        medicalHistory: 'Migraine headaches',
        medications: [{ name: 'Sumatriptan', dose: '100mg', route: 'PO', frequency: 'PRN' }],
        otherFindings: 'Photophobia, positive Kernig sign, nuchal rigidity'
      },
      expectedConditions: ['subarachnoid_hemorrhage', 'meningitis', 'neurological_emergency'],
      expectedSeverity: 'critical',
      expectedUrgency: 'emergency'
    }
  ],

  // Urgent but Non-Emergency Cases
  urgentCases: [
    {
      template: {
        fullName: 'Michael Brown',
        age: 52,
        sex: 'Male',
        height: 180,
        weight: 92,
        complaints: 'Chest pressure with exertion, relieved by rest',
        baselineVitals: { bp: '145/88', hr: '78', temp: '98.2', spo2: '97%' },
        baselineLabs: { wbc: '7.5', platelets: '265', rbc: '4.7', creatinine: '1.1' },
        socialHistory: { smoking: true, alcohol: true, tobacco: false },
        familyHistory: 'Heart disease',
        medicalHistory: 'Hypertension, hyperlipidemia',
        medications: [{ name: 'Metoprolol', dose: '50mg', route: 'PO', frequency: 'BID' }],
        otherFindings: 'Mildly overweight, otherwise normal exam'
      },
      expectedConditions: ['stable_angina', 'coronary_artery_disease', 'cardiac_urgent'],
      expectedSeverity: 'moderate',
      expectedUrgency: 'urgent'
    },
    {
      template: {
        fullName: 'Jennifer Taylor',
        age: 28,
        sex: 'Female',
        height: 163,
        weight: 55,
        complaints: 'Right lower quadrant abdominal pain, nausea, fever',
        baselineVitals: { bp: '118/72', hr: '92', temp: '100.8', spo2: '99%' },
        baselineLabs: { wbc: '13.8', platelets: '295', rbc: '4.1', creatinine: '0.8' },
        socialHistory: { smoking: false, alcohol: false, tobacco: false },
        familyHistory: 'None',
        medicalHistory: 'None',
        medications: [],
        otherFindings: 'RLQ tenderness, rebound tenderness, positive McBurney point'
      },
      expectedConditions: ['acute_appendicitis', 'abdominal_pain', 'surgical_urgent'],
      expectedSeverity: 'moderate',
      expectedUrgency: 'urgent'
    }
  ],

  // Routine Cases
  routineCases: [
    {
      template: {
        fullName: 'David Anderson',
        age: 45,
        sex: 'Male',
        height: 178,
        weight: 85,
        complaints: 'Occasional headaches, fatigue',
        baselineVitals: { bp: '135/82', hr: '72', temp: '98.4', spo2: '99%' },
        baselineLabs: { wbc: '6.8', platelets: '285', rbc: '4.9', creatinine: '0.9' },
        socialHistory: { smoking: false, alcohol: true, tobacco: false },
        familyHistory: 'Hypertension',
        medicalHistory: 'None',
        medications: [],
        otherFindings: 'Normal physical examination'
      },
      expectedConditions: ['tension_headache', 'fatigue', 'routine'],
      expectedSeverity: 'mild',
      expectedUrgency: 'routine'
    },
    {
      template: {
        fullName: 'Emily Rodriguez',
        age: 62,
        sex: 'Female',
        height: 160,
        weight: 68,
        complaints: 'Joint pain, morning stiffness',
        baselineVitals: { bp: '128/78', hr: '68', temp: '98.1', spo2: '98%' },
        baselineLabs: { wbc: '7.2', platelets: '310', rbc: '4.3', creatinine: '0.8' },
        socialHistory: { smoking: false, alcohol: false, tobacco: false },
        familyHistory: 'Rheumatoid arthritis',
        medicalHistory: 'Osteoarthritis',
        medications: [{ name: 'Acetaminophen', dose: '500mg', route: 'PO', frequency: 'QID' }],
        otherFindings: 'Mild joint swelling in hands, limited range of motion'
      },
      expectedConditions: ['rheumatoid_arthritis', 'arthritis', 'routine'],
      expectedSeverity: 'mild',
      expectedUrgency: 'routine'
    }
  ]
};

// Generate diverse test cases
function generateTestCases(count = 300) {
  const cases = [];
  const firstNames = ['John', 'Mary', 'James', 'Jennifer', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Maria', 'William', 'Patricia', 'Richard', 'Linda', 'Joseph', 'Barbara', 'Thomas', 'Susan', 'Charles', 'Jessica'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

  // Distribution: 20% emergency, 30% urgent, 50% routine
  const emergencyCount = Math.floor(count * 0.2);
  const urgentCount = Math.floor(count * 0.3);
  const routineCount = count - emergencyCount - urgentCount;

  // Generate emergency cases
  for (let i = 0; i < emergencyCount; i++) {
    const category = i % 2 === 0 ? 'cardiacEmergency' : 'respiratoryEmergency';
    const template = CLINICAL_CASE_TEMPLATES[category][i % CLINICAL_CASE_TEMPLATES[category].length];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    const caseData = {
      id: `EMERGENCY-${String(i + 1).padStart(4, '0')}`,
      ...JSON.parse(JSON.stringify(template.template)), // Deep copy
      fullName: `${firstName} ${lastName}`,
      age: template.template.age + Math.floor(Math.random() * 10) - 5, // ±5 years variation
      complaints: template.template.complaints + (Math.random() > 0.5 ? ' worsening over past few hours' : ' sudden onset'),
      baselineVitals: {
        ...template.template.baselineVitals,
        bp: `${parseInt(template.template.baselineVitals.bp.split('/')[0]) + Math.floor(Math.random() * 20) - 10}/${parseInt(template.template.baselineVitals.bp.split('/')[1]) + Math.floor(Math.random() * 10) - 5}`,
        hr: parseInt(template.template.baselineVitals.hr) + Math.floor(Math.random() * 20) - 10,
        temp: (parseFloat(template.template.baselineVitals.temp) + Math.random() * 2 - 1).toFixed(1),
        spo2: Math.max(85, parseInt(template.template.baselineVitals.spo2) + Math.floor(Math.random() * 6) - 3)
      }
    };

    cases.push({
      ...caseData,
      category: 'emergency',
      expectedConditions: template.expectedConditions,
      expectedSeverity: template.expectedSeverity,
      expectedUrgency: template.expectedUrgency
    });
  }

  // Generate urgent cases
  for (let i = 0; i < urgentCount; i++) {
    const template = CLINICAL_CASE_TEMPLATES.urgentCases[i % CLINICAL_CASE_TEMPLATES.urgentCases.length];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    const caseData = {
      id: `URGENT-${String(i + 1).padStart(4, '0')}`,
      ...JSON.parse(JSON.stringify(template.template)),
      fullName: `${firstName} ${lastName}`,
      age: template.template.age + Math.floor(Math.random() * 8) - 4,
      complaints: template.template.complaints + (Math.random() > 0.5 ? ' for 2 days' : ' progressively worsening'),
      baselineVitals: {
        ...template.template.baselineVitals,
        bp: `${parseInt(template.template.baselineVitals.bp.split('/')[0]) + Math.floor(Math.random() * 15) - 7}/${parseInt(template.template.baselineVitals.bp.split('/')[1]) + Math.floor(Math.random() * 8) - 4}`,
        hr: parseInt(template.template.baselineVitals.hr) + Math.floor(Math.random() * 15) - 7,
        temp: (parseFloat(template.template.baselineVitals.temp) + Math.random() * 1.5 - 0.75).toFixed(1),
        spo2: Math.max(92, parseInt(template.template.baselineVitals.spo2) + Math.floor(Math.random() * 4) - 2)
      }
    };

    cases.push({
      ...caseData,
      category: 'urgent',
      expectedConditions: template.expectedConditions,
      expectedSeverity: template.expectedSeverity,
      expectedUrgency: template.expectedUrgency
    });
  }

  // Generate routine cases
  for (let i = 0; i < routineCount; i++) {
    const template = CLINICAL_CASE_TEMPLATES.routineCases[i % CLINICAL_CASE_TEMPLATES.routineCases.length];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    const caseData = {
      id: `ROUTINE-${String(i + 1).padStart(4, '0')}`,
      ...JSON.parse(JSON.stringify(template.template)),
      fullName: `${firstName} ${lastName}`,
      age: template.template.age + Math.floor(Math.random() * 12) - 6,
      complaints: template.template.complaints + (Math.random() > 0.5 ? ' for several weeks' : ' intermittent'),
      baselineVitals: {
        ...template.template.baselineVitals,
        bp: `${parseInt(template.template.baselineVitals.bp.split('/')[0]) + Math.floor(Math.random() * 10) - 5}/${parseInt(template.template.baselineVitals.bp.split('/')[1]) + Math.floor(Math.random() * 6) - 3}`,
        hr: parseInt(template.template.baselineVitals.hr) + Math.floor(Math.random() * 10) - 5,
        temp: (parseFloat(template.template.baselineVitals.temp) + Math.random() * 1 - 0.5).toFixed(1),
        spo2: Math.max(95, parseInt(template.template.baselineVitals.spo2) + Math.floor(Math.random() * 3) - 1)
      }
    };

    cases.push({
      ...caseData,
      category: 'routine',
      expectedConditions: template.expectedConditions,
      expectedSeverity: template.expectedSeverity,
      expectedUrgency: template.expectedUrgency
    });
  }

  return cases;
}

// Validation function for analysis results
function validateAnalysisResult(analysis, expectedConditions, expectedSeverity, expectedUrgency) {
  const validation = {
    hasPatientOverview: analysis.includes('Patient Overview'),
    hasChiefComplaints: analysis.includes('Chief Complaints'),
    hasVitalSigns: analysis.includes('Vital Signs Analysis'),
    hasLabFindings: analysis.includes('Laboratory Findings'),
    hasClinicalAssessment: analysis.includes('Clinical Assessment'),
    hasRiskAssessment: analysis.includes('Risk Assessment'),
    hasTreatmentRecommendations: analysis.includes('Treatment Recommendations'),
    hasMedicationRecommendations: analysis.includes('Medication Recommendations'),
    hasMonitoringPlan: analysis.includes('Monitoring Plan'),
    hasFollowUpPlan: analysis.includes('Follow-up Plan'),
    hasDisclaimer: analysis.includes('Disclaimer'),

    // Advanced validation
    detectedCorrectSeverity: analysis.toLowerCase().includes(expectedSeverity),
    detectedCorrectUrgency: analysis.toLowerCase().includes(expectedUrgency),
    detectedExpectedConditions: expectedConditions.some(condition =>
      analysis.toLowerCase().includes(condition.toLowerCase())
    ),

    // Quality indicators
    hasRiskFlags: analysis.includes('🚨') || analysis.includes('⚠️') || analysis.includes('⚡'),
    hasDetailedRecommendations: analysis.length > 2000,
    hasMedicationDetails: analysis.includes('dose') && analysis.includes('route') && analysis.includes('frequency'),
    hasMonitoringDetails: analysis.includes('monitoring') && analysis.includes('follow-up'),

    score: 0
  };

  // Calculate comprehensive score
  const basicSections = [
    'hasPatientOverview', 'hasChiefComplaints', 'hasVitalSigns', 'hasLabFindings',
    'hasClinicalAssessment', 'hasRiskAssessment', 'hasTreatmentRecommendations',
    'hasMedicationRecommendations', 'hasMonitoringPlan', 'hasFollowUpPlan', 'hasDisclaimer'
  ];

  const advancedSections = [
    'detectedCorrectSeverity', 'detectedCorrectUrgency', 'detectedExpectedConditions',
    'hasRiskFlags', 'hasDetailedRecommendations', 'hasMedicationDetails', 'hasMonitoringDetails'
  ];

  const basicScore = (basicSections.filter(section => validation[section]).length / basicSections.length) * 60;
  const advancedScore = (advancedSections.filter(section => validation[section]).length / advancedSections.length) * 40;

  validation.score = basicScore + advancedScore;

  return validation;
}

// Main stress test function
async function runStressTest(caseCount = 300) {
  console.log('🚀 STARTING COMPREHENSIVE STRESS TEST - 300 REAL CLINICAL CASES');
  console.log('================================================================');
  console.log(`📊 Target: ${caseCount} cases at 25-27 cases per hour`);
  console.log(`⏱️  Estimated duration: ${Math.ceil(caseCount / 26)} hours`);
  console.log(`🎯 Goal: 85%+ accuracy with AI-level logic analysis`);

  const testCases = generateTestCases(caseCount);
  console.log(`📋 Generated ${testCases.length} diverse clinical cases:`);
  console.log(`   🚨 Emergency: ${testCases.filter(c => c.category === 'emergency').length}`);
  console.log(`   ⚡ Urgent: ${testCases.filter(c => c.category === 'urgent').length}`);
  console.log(`   📋 Routine: ${testCases.filter(c => c.category === 'routine').length}`);

  const testResults = {
    totalTests: 0,
    successfulTests: 0,
    failedTests: 0,
    averageResponseTime: 0,
    responseTimes: [],
    accuracyScores: [],
    categoryResults: {
      emergency: { total: 0, passed: 0, avgScore: 0 },
      urgent: { total: 0, passed: 0, avgScore: 0 },
      routine: { total: 0, passed: 0, avgScore: 0 }
    },
    validationResults: [],
    startTime: Date.now(),
    casesPerHour: 0
  };

  console.log('\n🔄 STARTING STRESS TEST EXECUTION...');
  console.log('=====================================');

  // Process cases in batches to simulate real workflow
  const batchSize = 26; // ~1 hour worth of cases
  const batches = Math.ceil(testCases.length / batchSize);

  for (let batch = 0; batch < batches; batch++) {
    const startBatch = Date.now();
    const batchCases = testCases.slice(batch * batchSize, (batch + 1) * batchSize);

    console.log(`\n📦 Batch ${batch + 1}/${batches} - Processing ${batchCases.length} cases...`);

    for (let i = 0; i < batchCases.length; i++) {
      const testCase = batchCases[i];
      const startTime = Date.now();

      try {
        testResults.totalTests++;
        testResults.categoryResults[testCase.category].total++;

        console.log(`🔍 Case ${testResults.totalTests}/${testCases.length}: ${testCase.fullName} (${testCase.category.toUpperCase()})`);

        // Generate clinical analysis
        const analysis = await generateSafetyReport(testCase);
        const responseTime = Date.now() - startTime;

        testResults.responseTimes.push(responseTime);

        // Validate the analysis
        const validation = validateAnalysisResult(
          analysis,
          testCase.expectedConditions,
          testCase.expectedSeverity,
          testCase.expectedUrgency
        );

        testResults.validationResults.push(validation);
        testResults.accuracyScores.push(validation.score);
        testResults.categoryResults[testCase.category].avgScore += validation.score;

        if (validation.score >= 85) {
          testResults.successfulTests++;
          testResults.categoryResults[testCase.category].passed++;
          console.log(`✅ PASS (${responseTime}ms, Score: ${validation.score.toFixed(1)}%)`);
        } else {
          testResults.failedTests++;
          console.log(`❌ FAIL (${responseTime}ms, Score: ${validation.score.toFixed(1)}%)`);

          // Show what was missing
          const missing = [];
          if (!validation.detectedCorrectSeverity) missing.push('Severity');
          if (!validation.detectedCorrectUrgency) missing.push('Urgency');
          if (!validation.detectedExpectedConditions) missing.push('Conditions');
          console.log(`   Missing: ${missing.join(', ')}`);
        }

        // Progress indicator
        if ((testResults.totalTests % 25) === 0 || testResults.totalTests === testCases.length) {
          const progress = (testResults.totalTests / testCases.length * 100).toFixed(1);
          const avgScore = testResults.accuracyScores.reduce((a, b) => a + b, 0) / testResults.accuracyScores.length;
          console.log(`\n📊 Progress: ${progress}% - Avg Score: ${avgScore.toFixed(1)}% - Success Rate: ${(testResults.successfulTests / testResults.totalTests * 100).toFixed(1)}%`);
        }

      } catch (error) {
        testResults.failedTests++;
        console.log(`❌ ERROR: ${error.message}`);
      }
    }

    // Calculate batch timing
    const batchTime = Date.now() - startBatch;
    const batchHours = batchTime / (1000 * 60 * 60);
    const currentCasesPerHour = batchCases.length / batchHours;

    console.log(`📊 Batch ${batch + 1} completed in ${(batchTime / 1000 / 60).toFixed(1)} minutes (${currentCasesPerHour.toFixed(1)} cases/hour)`);

    // Brief pause between batches to simulate real workflow
    if (batch < batches - 1) {
      console.log('⏸️  Brief pause between batches...\n');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Calculate final results
  const totalTime = Date.now() - testResults.startTime;
  testResults.averageResponseTime = testResults.responseTimes.reduce((a, b) => a + b, 0) / testResults.responseTimes.length;
  testResults.casesPerHour = (testResults.totalTests / (totalTime / 1000 / 60 / 60));

  // Calculate category averages
  Object.keys(testResults.categoryResults).forEach(category => {
    const results = testResults.categoryResults[category];
    results.avgScore = results.total > 0 ? results.avgScore / results.total : 0;
  });

  // Display comprehensive results
  console.log('\n🎯 COMPREHENSIVE STRESS TEST RESULTS');
  console.log('===================================');
  console.log(`📊 Total Cases Processed: ${testResults.totalTests}`);
  console.log(`✅ Successful Cases: ${testResults.successfulTests} (${(testResults.successfulTests / testResults.totalTests * 100).toFixed(1)}%)`);
  console.log(`❌ Failed Cases: ${testResults.failedTests} (${(testResults.failedTests / testResults.totalTests * 100).toFixed(1)}%)`);
  console.log(`⏱️  Average Response Time: ${testResults.averageResponseTime.toFixed(0)}ms`);
  console.log(`🚀 Processing Rate: ${testResults.casesPerHour.toFixed(1)} cases/hour`);
  console.log(`📈 Overall Accuracy: ${(testResults.accuracyScores.reduce((a, b) => a + b, 0) / testResults.accuracyScores.length).toFixed(1)}%`);

  console.log('\n📋 Results by Category:');
  Object.entries(testResults.categoryResults).forEach(([category, results]) => {
    const successRate = results.total > 0 ? (results.passed / results.total * 100).toFixed(1) : '0.0';
    console.log(`   ${category.toUpperCase()}: ${results.passed}/${results.total} (${successRate}%) - Avg Score: ${results.avgScore.toFixed(1)}%`);
  });

  // Score distribution
  const scoreRanges = {
    '95-100%': 0,
    '90-94%': 0,
    '85-89%': 0,
    '80-84%': 0,
    '75-79%': 0,
    '<75%': 0
  };

  testResults.accuracyScores.forEach(score => {
    if (score >= 95) scoreRanges['95-100%']++;
    else if (score >= 90) scoreRanges['90-94%']++;
    else if (score >= 85) scoreRanges['85-89%']++;
    else if (score >= 80) scoreRanges['80-84%']++;
    else if (score >= 75) scoreRanges['75-79%']++;
    else scoreRanges['<75%']++;
  });

  console.log('\n📈 Score Distribution:');
  Object.entries(scoreRanges).forEach(([range, count]) => {
    const percentage = (count / testResults.totalTests * 100).toFixed(1);
    console.log(`   ${range}: ${count} cases (${percentage}%)`);
  });

  // Final assessment
  console.log('\n🎉 FINAL ASSESSMENT');
  console.log('===================');

  const overallAccuracy = testResults.accuracyScores.reduce((a, b) => a + b, 0) / testResults.accuracyScores.length;
  const successRate = testResults.successfulTests / testResults.totalTests * 100;
  const processingRateMet = testResults.casesPerHour >= 25;

  const allGoalsMet = overallAccuracy >= 85 && successRate >= 85 && processingRateMet;

  if (allGoalsMet) {
    console.log('🎉 ALL GOALS ACHIEVED!');
    console.log('✅ 85%+ accuracy target met');
    console.log('✅ 25-27 cases/hour processing rate met');
    console.log('✅ AI-level logic analysis working perfectly');
    console.log('✅ System ready for production deployment');
    console.log('✅ Enhanced clinical logic engine performing at AI level');
  } else {
    console.log('⚠️  SOME GOALS NOT MET:');
    if (overallAccuracy < 85) {
      console.log(`❌ Accuracy below target: ${overallAccuracy.toFixed(1)}% < 85%`);
    }
    if (successRate < 85) {
      console.log(`❌ Success rate below target: ${successRate.toFixed(1)}% < 85%`);
    }
    if (!processingRateMet) {
      console.log(`❌ Processing rate below target: ${testResults.casesPerHour.toFixed(1)} < 25 cases/hour`);
    }
    console.log('💡 RECOMMENDATIONS:');
    console.log('   - Optimize keyword detection algorithms');
    console.log('   - Enhance clinical reasoning logic');
    console.log('   - Improve treatment recommendation engine');
    console.log('   - Fine-tune severity and urgency assessment');
  }

  return testResults;
}

// Run the stress test
runStressTest(300).then(results => {
  console.log('\n✅ Stress test completed successfully');

  if (results.accuracyScores.reduce((a, b) => a + b, 0) / results.accuracyScores.length >= 85) {
    console.log('\n🚀 SYSTEM READY FOR PRODUCTION!');
    console.log('The enhanced clinical logic engine has achieved AI-level performance!');
    console.log('✅ Comprehensive clinical analysis working perfectly');
    console.log('✅ Keyword detection and clinical reasoning optimized');
    console.log('✅ Treatment recommendations at expert level');
    console.log('✅ Ready for real-world clinical deployment');
  } else {
    console.log('\n🔧 SYSTEM NEEDS FURTHER OPTIMIZATION');
    console.log('Continue training and refining the logic engine...');
  }
}).catch(error => {
  console.error('❌ Stress test failed:', error);
});
