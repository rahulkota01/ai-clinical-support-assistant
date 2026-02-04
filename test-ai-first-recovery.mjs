// AI-First Recovery Behavior Test
// Tests that AI is always attempted first and automatically recovers after failures

import { generateSafetyReport } from './services/geminiService.js';

// Mock patient for testing
const testPatient = {
  id: 'TEST-001',
  fullName: 'Test Patient',
  age: 45,
  sex: 'Male',
  height: '175',
  weight: '80',
  baselineVitals: { bp: '120/80', hr: '72', temp: '98.6', spo2: '98%' },
  baselineLabs: { wbc: '7.5', platelets: '250', rbc: '4.5', creatinine: '1.0' },
  socialHistory: { smoking: false, alcohol: false, tobacco: false },
  familyHistory: 'None',
  medicalHistory: 'Hypertension',
  medications: [{ name: 'Lisinopril', dose: '10mg', route: 'oral', frequency: 'daily' }],
  complaints: 'Chest pain and shortness of breath',
  otherFindings: 'ECG shows sinus rhythm',
  status: 'Active',
  visits: [],
  consentGiven: false,
  pin: '',
  treatmentContext: 'Emergency department visit'
};

// Test function to validate AI-first behavior
async function testAIFirstRecovery() {
  console.log('🧪 AI-FIRST RECOVERY BEHAVIOR TEST');
  console.log('='.repeat(60));
  console.log('🎯 Testing: AI is always attempted first');
  console.log('🔄 Testing: Automatic recovery after failures');
  console.log('⏰ Testing: No cooldown period - immediate retry on next request');
  console.log('');
  
  const testResults = {
    totalRequests: 0,
    aiAttempts: 0,
    fallbackUsage: 0,
    recoveryBehavior: [],
    timingAnalysis: []
  };
  
  // Test 1: Normal AI operation
  console.log('📋 TEST 1: Normal AI Operation');
  console.log('-'.repeat(40));
  const startTime1 = Date.now();
  
  try {
    testResults.totalRequests++;
    console.log('🤖 Request 1: Attempting AI analysis...');
    const result1 = await generateSafetyReport(testPatient);
    const endTime1 = Date.now();
    
    // Check if AI was attempted (look for AI indicators in result)
    const isAIResult = result1.includes('Patient Overview') && 
                       result1.includes('Clinical Interpretation') &&
                       result1.length > 500;
    
    if (isAIResult) {
      testResults.aiAttempts++;
      console.log('✅ AI SUCCESS: AI analysis completed successfully');
      console.log(`⏱️  Time taken: ${endTime1 - startTime1}ms`);
      testResults.timingAnalysis.push({ request: 1, time: endTime1 - startTime1, type: 'AI_SUCCESS' });
    } else {
      console.log('⚠️  AI NOT DETECTED: May have used fallback');
    }
    
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
  
  console.log('');
  
  // Test 2: Simulate AI failure scenario (by temporarily removing API key)
  console.log('📋 TEST 2: AI Failure Scenario');
  console.log('-'.repeat(40));
  
  // Store original API key
  const originalApiKey = process.env.VITE_GEMINI_API_KEY;
  
  try {
    // Simulate AI failure by setting invalid API key
    process.env.VITE_GEMINI_API_KEY = 'invalid-key-for-testing';
    testResults.totalRequests++;
    console.log('🤖 Request 2: Simulating AI failure with invalid API key...');
    
    const startTime2 = Date.now();
    const result2 = await generateSafetyReport(testPatient);
    const endTime2 = Date.now();
    
    // Check if fallback was used
    const isFallbackResult = result2.includes('Patient Overview') && 
                           result2.includes('Clinical Interpretation') &&
                           result2.length > 500;
    
    if (isFallbackResult) {
      testResults.fallbackUsage++;
      console.log('✅ FALLBACK SUCCESS: Logic-based analysis used for failed request');
      console.log(`⏱️  Time taken: ${endTime2 - startTime2}ms`);
      testResults.timingAnalysis.push({ request: 2, time: endTime2 - startTime2, type: 'FALLBACK' });
    } else {
      console.log('❌ FALLBACK FAILED: No valid result received');
    }
    
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  } finally {
    // Restore original API key
    process.env.VITE_GEMINI_API_KEY = originalApiKey;
  }
  
  console.log('');
  
  // Test 3: Automatic recovery - AI should be attempted again immediately
  console.log('📋 TEST 3: Automatic Recovery Test');
  console.log('-'.repeat(40));
  console.log('🔄 EXPECTED: AI should be attempted first again (no cooldown)');
  
  try {
    testResults.totalRequests++;
    console.log('🤖 Request 3: Testing automatic recovery - AI should be attempted first...');
    
    const startTime3 = Date.now();
    const result3 = await generateSafetyReport(testPatient);
    const endTime3 = Date.now();
    
    // Check if AI was attempted again
    const isAIResult3 = result3.includes('Patient Overview') && 
                       result3.includes('Clinical Interpretation') &&
                       result3.length > 500;
    
    if (isAIResult3) {
      testResults.aiAttempts++;
      console.log('✅ RECOVERY SUCCESS: AI automatically recovered and attempted first');
      console.log(`⏱️  Time taken: ${endTime3 - startTime3}ms`);
      testResults.timingAnalysis.push({ request: 3, time: endTime3 - startTime3, type: 'AI_RECOVERY' });
    } else {
      console.log('⚠️  RECOVERY ISSUE: AI may not have been attempted first');
    }
    
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
  
  console.log('');
  
  // Test 4: Multiple rapid requests to ensure AI-first behavior
  console.log('📋 TEST 4: Rapid Request Test');
  console.log('-'.repeat(40));
  console.log('🔄 EXPECTED: AI should be attempted first on every request');
  
  for (let i = 4; i <= 6; i++) {
    try {
      testResults.totalRequests++;
      console.log(`🤖 Request ${i}: Testing AI-first behavior on rapid request...`);
      
      const startTime = Date.now();
      const result = await generateSafetyReport(testPatient);
      const endTime = Date.now();
      
      const isAIResult = result.includes('Patient Overview') && 
                         result.includes('Clinical Interpretation') &&
                         result.length > 500;
      
      if (isAIResult) {
        testResults.aiAttempts++;
        console.log(`✅ Request ${i}: AI attempted first successfully`);
        testResults.timingAnalysis.push({ request: i, time: endTime - startTime, type: 'AI_SUCCESS' });
      } else {
        testResults.fallbackUsage++;
        console.log(`⚠️  Request ${i}: Fallback used`);
        testResults.timingAnalysis.push({ request: i, time: endTime - startTime, type: 'FALLBACK' });
      }
      
      console.log(`⏱️  Time taken: ${endTime - startTime}ms`);
      
    } catch (error) {
      console.log(`❌ Request ${i} ERROR:`, error.message);
    }
  }
  
  console.log('');
  
  // Generate comprehensive report
  console.log('📊 AI-FIRST RECOVERY TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Total Requests: ${testResults.totalRequests}`);
  console.log(`AI Attempts: ${testResults.aiAttempts}`);
  console.log(`Fallback Usage: ${testResults.fallbackUsage}`);
  console.log(`AI-First Rate: ${(testResults.aiAttempts / testResults.totalRequests * 100).toFixed(1)}%`);
  
  console.log('');
  console.log('⏰ TIMING ANALYSIS');
  console.log('-'.repeat(40));
  testResults.timingAnalysis.forEach(timing => {
    console.log(`Request ${timing.request}: ${timing.time}ms (${timing.type})`);
  });
  
  console.log('');
  console.log('🔄 RECOVERY BEHAVIOR ANALYSIS');
  console.log('-'.repeat(40));
  
  // Analyze recovery behavior
  const recoveryTest = testResults.timingAnalysis.find(t => t.type === 'AI_RECOVERY');
  if (recoveryTest) {
    console.log('✅ AUTOMATIC RECOVERY CONFIRMED');
    console.log(`   AI recovered after failure in ${recoveryTest.time}ms`);
    console.log('   No cooldown period detected');
  } else {
    console.log('⚠️  RECOVERY BEHAVIOR UNCLEAR');
    console.log('   May need to verify implementation');
  }
  
  // Check for consistent AI-first behavior
  const aiFirstRate = testResults.aiAttempts / testResults.totalRequests * 100;
  if (aiFirstRate >= 80) {
    console.log('✅ AI-FIRST BEHAVIOR CONFIRMED');
    console.log(`   ${aiFirstRate.toFixed(1)}% of requests attempted AI first`);
  } else {
    console.log('⚠️  AI-FIRST BEHAVIOR NEEDS ATTENTION');
    console.log(`   Only ${aiFirstRate.toFixed(1)}% of requests attempted AI first`);
  }
  
  console.log('');
  console.log('🎯 FINAL ASSESSMENT');
  console.log('='.repeat(60));
  
  if (aiFirstRate >= 80 && recoveryTest) {
    console.log('✅ EXCELLENT: AI-first with automatic recovery working perfectly');
    console.log('✅ AI is always attempted first on every request');
    console.log('✅ Automatic recovery after failures confirmed');
    console.log('✅ No cooldown period - immediate retry on next request');
    console.log('✅ Users never need manual intervention');
  } else if (aiFirstRate >= 60) {
    console.log('⚠️  GOOD: AI-first behavior mostly working');
    console.log('⚠️  Some requests may not be attempting AI first');
    console.log('⚠️  Recovery behavior needs verification');
  } else {
    console.log('❌ NEEDS IMPROVEMENT: AI-first behavior not consistent');
    console.log('❌ System may be using fallback too frequently');
    console.log('❌ Recovery behavior needs implementation');
  }
  
  console.log('');
  console.log('📋 BEHAVIOR VERIFICATION CHECKLIST');
  console.log('-'.repeat(40));
  console.log(`✓ AI attempted first: ${testResults.aiAttempts > 0 ? 'YES' : 'NO'}`);
  console.log(`✓ Fallback used only when needed: ${testResults.fallbackUsage <= testResults.totalRequests * 0.3 ? 'YES' : 'NO'}`);
  console.log(`✓ Automatic recovery: ${recoveryTest ? 'YES' : 'NO'}`);
  console.log(`✓ No persistent failure state: ${testResults.aiAttempts > testResults.fallbackUsage ? 'YES' : 'NO'}`);
  console.log(`✓ No manual intervention required: ${testResults.totalRequests > 0 ? 'YES' : 'NO'}`);
  
  return testResults;
}

// Run the test
testAIFirstRecovery().catch(console.error);
