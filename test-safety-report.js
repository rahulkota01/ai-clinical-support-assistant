import { generateSafetyReport } from './services/geminiService.ts';

const testPatient = {
  id: 'TEST-001',
  fullName: 'John Doe',
  age: 45,
  sex: 'Male',
  height: '175',
  weight: '80',
  baselineVitals: { bp: '120/80', hr: '72', temp: '98.6', spo2: '98' },
  baselineLabs: { wbc: '7.2', platelets: '250', rbc: '4.5', creatinine: '1.0' },
  socialHistory: { smoking: false, alcohol: false, tobacco: false },
  familyHistory: 'Father had hypertension',
  medications: [
    { name: 'Lisinopril', dose: '10mg', route: 'Oral', frequency: 'QD' },
    { name: 'Metformin', dose: '500mg', route: 'Oral', frequency: 'BID' }
  ],
  complaints: 'Chest pain and shortness of breath',
  medicalHistory: 'Hypertension, Type 2 Diabetes',
  treatmentContext: '',
  status: 'Active',
  visits: [],
  consentGiven: true,
  pin: '1234'
};

async function testSafetyReport() {
  console.log('Testing generateSafetyReport function...');
  try {
    const report = await generateSafetyReport(testPatient);
    console.log('✅ Safety report generated successfully!');
    console.log('Report length:', report.length);
    console.log('First 500 characters:');
    console.log(report.substring(0, 500) + '...');
  } catch (error) {
    console.error('❌ Error generating safety report:', error.message);
  }
}

testSafetyReport();
