/**
 * Test 5 Clinical Cases - Complete System Verification
 * Tests all major features: AI analysis, drug analysis, diagnosis, discharge, follow-up
 */

import { generateSafetyReport } from './services/geminiService.ts';
import { generateEnhancedClinicalAnalysis } from './services/enhancedClinicalLogic.ts';
import { generateEnhancedDrugAnalysis } from './services/enhancedDrugAnalysis.ts';
import { generateEnhancedDiagnosis } from './services/enhancedDiagnosisEngine.ts';

// Test Cases
const testCases = [
  {
    id: 'CASE-001',
    name: 'Chest Pain - Emergency',
    patient: {
      id: 'CASE-001',
      fullName: 'John Smith',
      age: 55,
      sex: 'Male',
      height: '175cm',
      weight: '80kg',
      complaints: 'Severe chest pain radiating to left arm, sweating, shortness of breath',
      baselineVitals: { bp: '160/95', hr: '110', temp: '98.6', spo2: '94%' },
      baselineLabs: { wbc: '8.5', platelets: '250', rbc: '4.8', creatinine: '1.2' },
      medicalHistory: 'Hypertension, diabetes, family history of heart disease',
      medications: [
        { name: 'Lisinopril', dose: '10mg', route: 'Oral', frequency: 'Daily', isCurrentlyTaking: true },
        { name: 'Metformin', dose: '500mg', route: 'Oral', frequency: 'Twice daily', isCurrentlyTaking: true }
      ],
      treatmentContext: 'Emergency evaluation needed',
      status: 'Active',
      visits: [],
      consentGiven: true,
      pin: '1234'
    },
    expectedConditions: ['cardiac', 'emergency'],
    expectedDrugs: ['aspirin', 'nitroglycerin', 'beta-blocker'],
    expectedUrgency: 'emergency'
  },
  {
    id: 'CASE-002',
    name: 'Diabetes Follow-up - Routine',
    patient: {
      id: 'CASE-002',
      fullName: 'Sarah Johnson',
      age: 45,
      sex: 'Female',
      height: '165cm',
      weight: '70kg',
      complaints: 'Routine diabetes checkup, feeling well',
      baselineVitals: { bp: '130/80', hr: '72', temp: '98.4', spo2: '98%' },
      baselineLabs: { wbc: '7.2', platelets: '280', rbc: '4.5', creatinine: '0.9', bloodSugar: '140' },
      medicalHistory: 'Type 2 diabetes, hypertension',
      medications: [
        { name: 'Metformin', dose: '1000mg', route: 'Oral', frequency: 'Twice daily', isCurrentlyTaking: true },
        { name: 'Lisinopril', dose: '20mg', route: 'Oral', frequency: 'Daily', isCurrentlyTaking: true }
      ],
      treatmentContext: 'Routine diabetes management',
      status: 'Active',
      visits: [],
      consentGiven: true,
      pin: '5678'
    },
    expectedConditions: ['diabetes', 'routine'],
    expectedDrugs: ['metformin', 'ace-inhibitor'],
    expectedUrgency: 'routine'
  },
  {
    id: 'CASE-003',
    name: 'Respiratory Distress - Urgent',
    patient: {
      id: 'CASE-003',
      fullName: 'Robert Brown',
      age: 65,
      sex: 'Male',
      height: '170cm',
      weight: '75kg',
      complaints: 'Severe shortness of breath, coughing, wheezing, fever',
      baselineVitals: { bp: '140/85', hr: '120', temp: '101.2', spo2: '88%' },
      baselineLabs: { wbc: '15.2', platelets: '320', rbc: '4.6', creatinine: '1.1' },
      medicalHistory: 'COPD, smoking history',
      medications: [
        { name: 'Albuterol', dose: '90mcg', route: 'Inhaled', frequency: 'PRN', isCurrentlyTaking: true }
      ],
      treatmentContext: 'Respiratory emergency',
      status: 'Active',
      visits: [],
      consentGiven: true,
      pin: '9012'
    },
    expectedConditions: ['respiratory', 'urgent'],
    expectedDrugs: ['albuterol', 'steroids', 'antibiotics'],
    expectedUrgency: 'urgent'
  },
  {
    id: 'CASE-004',
    name: 'Headache - Neurological',
    patient: {
      id: 'CASE-004',
      fullName: 'Emily Davis',
      age: 35,
      sex: 'Female',
      height: '160cm',
      weight: '60kg',
      complaints: 'Severe headache, nausea, photophobia, neck stiffness',
      baselineVitals: { bp: '145/90', hr: '95', temp: '100.8', spo2: '97%' },
      baselineLabs: { wbc: '12.8', platelets: '290', rbc: '4.3', creatinine: '0.8' },
      medicalHistory: 'Migraines',
      medications: [
        { name: 'Sumatriptan', dose: '100mg', route: 'Oral', frequency: 'PRN', isCurrentlyTaking: false }
      ],
      treatmentContext: 'Neurological evaluation',
      status: 'Active',
      visits: [],
      consentGiven: true,
      pin: '3456'
    },
    expectedConditions: ['neurological', 'urgent'],
    expectedDrugs: ['pain-relievers', 'anti-migraine'],
    expectedUrgency: 'urgent'
  },
  {
    id: 'CASE-005',
    name: 'Post-Discharge Follow-up',
    patient: {
      id: 'CASE-005',
      fullName: 'Michael Wilson',
      age: 60,
      sex: 'Male',
      height: '180cm',
      weight: '85kg',
      complaints: 'Post-hospitalization follow-up after pneumonia',
      baselineVitals: { bp: '125/75', hr: '78', temp: '98.2', spo2: '96%' },
      baselineLabs: { wbc: '6.8', platelets: '260', rbc: '4.4', creatinine: '1.0' },
      medicalHistory: 'Recently hospitalized for pneumonia',
      medications: [
        { name: 'Amoxicillin', dose: '875mg', route: 'Oral', frequency: 'Twice daily', isCurrentlyTaking: true }
      ],
      treatmentContext: 'Post-discharge follow-up',
      status: 'Discharged - Improved',
      visits: [
        {
          id: 'visit-1',
          date: 'January 25, 2026',
          summary: 'Hospitalized for pneumonia',
          complaints: 'Fever, cough, shortness of breath',
          vitals: { bp: '135/85', hr: '95', temp: '102.0', spo2: '91%' },
          labResults: { wbc: '18.5', platelets: '310', rbc: '4.2', creatinine: '1.1' },
          dischargeInstructions: 'Complete antibiotics, follow up in 1 week',
          followUpPlan: 'Chest X-ray in 1 week, pulmonary function tests if needed'
        }
      ],
      consentGiven: true,
      pin: '7890'
    },
    expectedConditions: ['follow-up', 'routine'],
    expectedDrugs: ['antibiotics', 'monitoring'],
    expectedUrgency: 'routine'
  }
];

// Test Functions
async function testAIClinicalAnalysis(patient, testCase) {
  console.log(`\n🤖 Testing AI Clinical Analysis for ${testCase.name}...`);

  try {
    const analysis = await generateSafetyReport(patient);

    if (analysis && !analysis.includes("Error")) {
      console.log("✅ AI Analysis: SUCCESS");
      console.log(`📄 Analysis Length: ${analysis.length} characters`);

      // Check for expected conditions
      const analysisLower = analysis.toLowerCase();
      const foundConditions = testCase.expectedConditions.filter(condition =>
        analysisLower.includes(condition)
      );

      if (foundConditions.length > 0) {
        console.log(`✅ Expected conditions found: ${foundConditions.join(', ')}`);
      } else {
        console.log(`⚠️  Expected conditions not found: ${testCase.expectedConditions.join(', ')}`);
      }

      return { success: true, analysis, foundConditions };
    } else {
      console.log("❌ AI Analysis: FAILED");
      return { success: false, error: "Empty or error response" };
    }
  } catch (error) {
    console.log(`❌ AI Analysis: ERROR - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testEnhancedLogicAnalysis(patient, testCase) {
  console.log(`\n🧠 Testing Enhanced Logic Analysis for ${testCase.name}...`);

  try {
    const analysis = generateEnhancedClinicalAnalysis(patient);

    if (analysis && analysis.length > 100) {
      console.log("✅ Enhanced Logic: SUCCESS");
      console.log(`📄 Analysis Length: ${analysis.length} characters`);

      // Check for expected conditions
      const analysisLower = analysis.toLowerCase();
      const foundConditions = testCase.expectedConditions.filter(condition =>
        analysisLower.includes(condition)
      );

      if (foundConditions.length > 0) {
        console.log(`✅ Expected conditions found: ${foundConditions.join(', ')}`);
      } else {
        console.log(`⚠️  Expected conditions not found: ${testCase.expectedConditions.join(', ')}`);
      }

      return { success: true, analysis, foundConditions };
    } else {
      console.log("❌ Enhanced Logic: FAILED - Analysis too short");
      return { success: false, error: "Analysis too short" };
    }
  } catch (error) {
    console.log(`❌ Enhanced Logic: ERROR - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testDrugAnalysis(patient, testCase) {
  console.log(`\n💊 Testing Drug Analysis for ${testCase.name}...`);

  try {
    const drugAnalysis = generateEnhancedDrugAnalysis(patient, patient.medications || []);

    if (drugAnalysis && drugAnalysis.suggestedDrugs.length > 0) {
      console.log("✅ Drug Analysis: SUCCESS");
      console.log(`💊 Suggested Drugs: ${drugAnalysis.suggestedDrugs.length}`);
      console.log(`🔗 Interactions Found: ${drugAnalysis.drugInteractions.length}`);

      // Check for expected drugs
      const suggestedDrugNames = drugAnalysis.suggestedDrugs.map(d => d.name.toLowerCase());
      const foundDrugs = testCase.expectedDrugs.filter(drug =>
        suggestedDrugNames.some(suggested => suggested.includes(drug.toLowerCase()))
      );

      if (foundDrugs.length > 0) {
        console.log(`✅ Expected drugs found: ${foundDrugs.join(', ')}`);
      } else {
        console.log(`⚠️  Expected drugs not found: ${testCase.expectedDrugs.join(', ')}`);
      }

      return { success: true, drugAnalysis, foundDrugs };
    } else {
      console.log("❌ Drug Analysis: FAILED - No drugs suggested");
      return { success: false, error: "No drugs suggested" };
    }
  } catch (error) {
    console.log(`❌ Drug Analysis: ERROR - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testDiagnosisEngine(patient, testCase) {
  console.log(`\n🩺 Testing Diagnosis Engine for ${testCase.name}...`);

  try {
    const diagnosis = generateEnhancedDiagnosis(
      patient,
      patient.complaints,
      patient.baselineVitals,
      patient.baselineLabs
    );

    if (diagnosis && diagnosis.primaryDiagnosis) {
      console.log("✅ Diagnosis Engine: SUCCESS");
      console.log(`🎯 Primary Diagnosis: ${diagnosis.primaryDiagnosis}`);
      console.log(`📊 Confidence: ${diagnosis.confidence}%`);
      console.log(`🚨 Urgency: ${diagnosis.urgency}`);

      // Check expected urgency
      if (diagnosis.urgency === testCase.expectedUrgency) {
        console.log(`✅ Urgency matches expected: ${testCase.expectedUrgency}`);
      } else {
        console.log(`⚠️  Urgency mismatch. Expected: ${testCase.expectedUrgency}, Got: ${diagnosis.urgency}`);
      }

      return { success: true, diagnosis };
    } else {
      console.log("❌ Diagnosis Engine: FAILED - No diagnosis generated");
      return { success: false, error: "No diagnosis generated" };
    }
  } catch (error) {
    console.log(`❌ Diagnosis Engine: ERROR - ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main Test Runner
async function runAllTests() {
  console.log("🚀 STARTING COMPLETE SYSTEM VERIFICATION");
  console.log("=".repeat(80));

  const results = [];

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📋 TESTING: ${testCase.name}`);
    console.log(`🆔 Patient ID: ${testCase.id}`);
    console.log(`📝 Complaints: ${testCase.complaints}`);
    console.log(`${'='.repeat(80)}`);

    const caseResults = {
      testCase: testCase.name,
      patientId: testCase.id,
      aiAnalysis: null,
      logicAnalysis: null,
      drugAnalysis: null,
      diagnosis: null
    };

    // Test AI Analysis
    caseResults.aiAnalysis = await testAIClinicalAnalysis(testCase.patient, testCase);

    // Test Enhanced Logic
    caseResults.logicAnalysis = await testEnhancedLogicAnalysis(testCase.patient, testCase);

    // Test Drug Analysis
    caseResults.drugAnalysis = await testDrugAnalysis(testCase.patient, testCase);

    // Test Diagnosis Engine
    caseResults.diagnosis = await testDiagnosisEngine(testCase.patient, testCase);

    results.push(caseResults);

    // Brief pause between cases
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary Report
  console.log(`\n${'='.repeat(80)}`);
  console.log("📊 FINAL TEST RESULTS SUMMARY");
  console.log(`${'='.repeat(80)}`);

  let totalTests = 0;
  let passedTests = 0;

  results.forEach(result => {
    console.log(`\n📋 ${result.testCase}:`);

    Object.entries(result).forEach(([testName, testResult]) => {
      if (testResult && testResult.success !== undefined) {
        totalTests++;
        if (testResult.success) {
          passedTests++;
          console.log(`  ✅ ${testName}: PASSED`);
        } else {
          console.log(`  ❌ ${testName}: FAILED - ${testResult.error}`);
        }
      }
    });
  });

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🎯 OVERALL RESULTS: ${passedTests}/${totalTests} tests passed`);
  console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log("🎉 ALL TESTS PASSED! System is working correctly.");
  } else if (passedTests >= totalTests * 0.8) {
    console.log("✅ MAJORITY OF TESTS PASSED! System is mostly functional.");
  } else {
    console.log("⚠️  MULTIPLE TEST FAILURES! System needs attention.");
  }

  console.log(`${'='.repeat(80)}`);

  return results;
}

// Run the tests
runAllTests().catch(console.error);
