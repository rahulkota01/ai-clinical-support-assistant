import dotenv from 'dotenv';
try {
  dotenv.config({ path: '.env.local' });
} catch (e) { }

import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { ChatMessage, Patient } from "../types";
import { DRUG_DATABASE, DrugInteraction } from './drugDatabase';
import { SYSTEM_PROMPT, CLINICAL_REASONING_SYSTEM_PROMPT } from "../constants_temp";
import { generateEnhancedClinicalAnalysis } from "./enhancedClinicalLogic";
import { grokService } from "./grokService";
import { enhancedDrugInteractionService } from "./enhancedDrugInteractionService";

// Cross-environment API key retrieval (Vite + Node.js)
const getApiKey = () => {
  try {
    // @ts-ignore - Handle Vite environment
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
      return import.meta.env.VITE_GEMINI_API_KEY;
    }
  } catch (e) { }

  // Handle Node.js environment
  return (typeof process !== 'undefined' && process.env)
    ? (process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "")
    : "";
};

const API_KEY = getApiKey();

const FLASH_MODEL_CANDIDATES = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-2.0-flash-exp",
  "gemini-1.5-pro",
  "gemini-1.0-pro",
] as const;

/**
 * Clean AI response by removing markdown artifacts and formatting properly
 */
const cleanAIResponse = (response: string): string => {
  if (!response) return '';

  return response
    // Remove markdown headers (# ## ### etc)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold markdown (**text**)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    // Remove italic markdown (*text*)
    .replace(/\*([^*]+)\*/g, '$1')
    // Remove numbered lists (1. 2. etc)
    .replace(/^\d+\.\s+/gm, '• ')
    // Remove bullet points with *
    .replace(/^\*\s+/gm, '• ')
    // Remove bullet points with -
    .replace(/^-\s+/gm, '• ')
    // Remove multiple consecutive newlines
    .replace(/\n{3,}/g, '\n\n')
    // Clean up extra spaces
    .replace(/[ \t]+/g, ' ')
    // Remove leading/trailing whitespace
    .trim();
};

/**
 * Format AI analysis report with clean medical styling
 */
const formatMedicalReport = (response: string): string => {
  const cleaned = cleanAIResponse(response);

  // Split into sections and format
  const sections = cleaned.split(/\n\n+/);
  const formattedSections = sections.map(section => {
    const lines = section.split('\n').filter(line => line.trim());

    if (lines.length === 0) return '';

    // First line is typically a section title - make it bold
    const title = lines[0].replace(/^•\s*/, '').trim();
    const content = lines.slice(1).map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('•')) {
        // Format bullet points with italics for emphasis
        const bulletContent = trimmed.replace(/^•\s*/, '');
        // Highlight important clinical terms in italics
        const highlightedContent = bulletContent
          .replace(/\b(normal|abnormal|elevated|reduced|increased|decreased|high|low|critical|significant|mild|moderate|severe|urgent|emergency|immediate|important|essential|key|major|minor)\b/gi, '*$1*')
          .replace(/\b(BP|HR|Temp|SpO2|WBC|RBC|Hb|Hct|MCV|MCH|MCHC|ESR|CRP|Glucose|Na|K|Cl|HCO3|BUN|Creatinine|AST|ALT|Alk|Phos|Bilirubin|Albumin|LDL|HDL|Triglycerides|Cholesterol|BMI|ECG|EKG|CT|MRI|X-ray|Ultrasound)\b/g, '*$1*')
          .replace(/\b(hypertension|hypotension|tachycardia|bradycardia|fever|pyrexia|hypoxia|anemia|leukocytosis|leukopenia|thrombocytosis|thrombocytopenia|hyperglycemia|hypoglycemia|hyponatremia|hypernatremia|hypokalemia|hyperkalemia|renal|hepatic|cardiac|pulmonary|neurologic)\b/gi, '*$1*');
        return `  • ${highlightedContent}`;
      }
      // Highlight important clinical terms and subheadings in regular text
      const highlightedText = trimmed
        .replace(/\b(normal|abnormal|elevated|reduced|increased|decreased|high|low|critical|significant|mild|moderate|severe|urgent|emergency|immediate|important|essential|key|major|minor)\b/gi, '*$1*')
        .replace(/\b(BP|HR|Temp|SpO2|WBC|RBC|Hb|Hct|MCV|MCH|MCHC|ESR|CRP|Glucose|Na|K|Cl|HCO3|BUN|Creatinine|AST|ALT|Alk|Phos|Bilirubin|Albumin|LDL|HDL|Triglycerides|Cholesterol|BMI|ECG|EKG|CT|MRI|X-ray|Ultrasound)\b/g, '*$1*')
        .replace(/\b(hypertension|hypotension|tachycardia|bradycardia|fever|pyrexia|hypoxia|anemia|leukocytosis|leukopenia|thrombocytosis|thrombocytopenia|hyperglycemia|hypoglycemia|hyponatremia|hypernatremia|hypokalemia|hyperkalemia|renal|hepatic|cardiac|pulmonary|neurologic)\b/gi, '*$1*')
        // Make subheadings italic (lines that end with colon or are shorter)
        .replace(/^([A-Z][a-zA-Z\s]+:)/, '*$1*');
      return highlightedText;
    }).join('\n');

    return `**${title}**\n${content}`;
  });

  return formattedSections.join('\n\n');
};

function shouldRetryWithNextModel(err: unknown): boolean {
  const msg = String((err as any)?.message ?? err).toLowerCase();
  // Retry on 404 (Not Found), 429 (Quota Exceeded), or 503 (Overloaded)
  return (
    msg.includes("[404]") ||
    msg.includes("not found") ||
    msg.includes("not supported for generatecontent") ||
    (msg.includes("models/") && msg.includes("not found")) ||
    msg.includes("[429]") ||
    msg.includes("quota") ||
    msg.includes("[503]") ||
    msg.includes("overloaded")
  );
}

/**
 * Execute with fallback models and comprehensive error handling
 */
async function executeWithFallback(
  genAI: GoogleGenerativeAI,
  operation: (model: GenerativeModel) => Promise<string>,
  systemInstruction?: string
): Promise<{ text: string; modelUsed: string }> {
  let lastErr: unknown = null;

  // Defensive check for API key
  if (!API_KEY || API_KEY.trim() === '') {
    return {
      text: "API key is missing or invalid. Please check your configuration.",
      modelUsed: "none"
    };
  }

  for (const modelName of FLASH_MODEL_CANDIDATES) {

    try {
      console.log(`Trying model: ${modelName}`);

      // Determine if model supports system instructions (defensive check)
      const useSystemInstruction = systemInstruction &&
        !modelName.includes('gemini-1.0-pro') &&
        !modelName.includes('vision');

      const model = genAI.getGenerativeModel({
        model: modelName,
        ...(useSystemInstruction && { systemInstruction })
      });

      // Add timeout to prevent hanging - reduced for better responsiveness
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout after 15 seconds")), 15000);
      });

      const result = await Promise.race([
        operation(model),
        timeoutPromise
      ]);

      // Validate response
      if (!result || typeof result !== 'string') {
        throw new Error("Invalid response format");
      }

      if (result.trim().length === 0) {
        throw new Error("Empty response received");
      }

      console.log(`✅ Success with model: ${modelName}`);
      return { text: result, modelUsed: modelName };

    } catch (err: unknown) {
      lastErr = err;
      const errorMsg = String((err as any)?.message ?? err);
      console.warn(`❌ Model ${modelName} failed:`, errorMsg);

      // Continue to next model if this one failed
      continue;
    }
  }

  // All models failed
  const finalError = String(lastErr ?? "Unknown error");
  console.error("All models failed. Last error:", finalError);

  // Return user-friendly error message
  return {
    text: `I'm currently experiencing technical difficulties. The AI service is temporarily unavailable. Please try again in a few moments. Error: ${finalError.includes('quota') ? 'API quota exceeded' : 'Service unavailable'}`,
    modelUsed: "none"
  };
}

/**
 * Get AI response for chat conversations (Virtual AI Doctor)
 * Uses proper chat history with Gemini's chat session API
 */
export const getAIResponse = async (
  history: ChatMessage[],
  userMessage: string,
  patientContext?: Patient
): Promise<string> => {
  try {
    // Defensive checks
    if (!API_KEY || API_KEY.trim() === '') {
      console.error("Gemini API Key missing. Check .env.local file.");
      return "I'm having trouble connecting to my AI service. Please check the API configuration and try again.";
    }

    if (!userMessage || typeof userMessage !== 'string' || userMessage.trim().length === 0) {
      return "I didn't receive your message. Please try again.";
    }

    if (userMessage.length > 10000) {
      return "Your message is quite long. Please try with a shorter message.";
    }

    const genAI = new GoogleGenerativeAI(API_KEY);

    // Validate and sanitize history
    const validHistory = Array.isArray(history) ? history.filter(msg =>
      msg &&
      typeof msg === 'object' &&
      typeof msg.content === 'string' &&
      typeof msg.role === 'string' &&
      ['user', 'assistant'].includes(msg.role) &&
      msg.content.trim().length > 0 &&
      msg.content.length < 5000
    ).slice(-10) : []; // Keep only last 10 messages

    // Build patient context if available
    const context = patientContext ? `
### PATIENT CLINICAL PROFILE (CRITICAL CONTEXT):
You are speaking with this specific patient. All your answers must be tailored to their profile.

- **Demographics:** ${patientContext.age || 'Unknown'} years old, ${patientContext.sex || 'Unknown'}
- **Chief Complaint (on admission):** ${patientContext.complaints || "None recorded"}
- **Medical History:** ${patientContext.medicalHistory || "None recorded"}
- **Current Medications:** ${patientContext.medications?.map(m => `${m.name} (${m.dose}, ${m.route}, ${m.frequency})`).join("; ") || "None"}
- **Baseline Vitals:** BP: ${patientContext.baselineVitals?.bp || 'N/A'}, HR: ${patientContext.baselineVitals?.hr || 'N/A'}, Temp: ${patientContext.baselineVitals?.temp || 'N/A'}, SpO2: ${patientContext.baselineVitals?.spo2 || 'N/A'}
` : "";

    // Build the full system instruction for the patient chat bot.
    // This prompt is specifically engineered to force a structured analytical response for EVERY user message.
    const systemInstruction = `
${SYSTEM_PROMPT}

${context}

### INSTRUCTIONS:
1. **Analyze the User's Input:** Understand their new symptom or question.
2. **Cross-Reference with Patient Profile:** 
   - Does their medical history explain this?
   - Could this be a side effect of their current medications?
   - Is this related to their chief complaint?
   - **YOU MUST EXPLICITLY REFERENCE THE PATIENT'S DETAILS (Medications, History, Vitals) in your analysis.**
3. **Provide a Structured Response:** Follow the mandatory structure below.

### MANDATORY RESPONSE STRUCTURE FOR EACH MESSAGE:
1.  **Understanding of Complaint:** Briefly summarize the user's message in clinical terms.
2.  **Clinical Reasoning (Personalized):** Explain your thought process, **specifically referencing the patient's medical history, medications, and vitals** where relevant.
3.  **Possible Causes (Differential Diagnosis):** List potential reasons for the symptoms in simple language.
4.  **Red Flags:** Clearly state any "red flag" symptoms that warrant immediate medical attention.
5.  **General Guidance:** Provide safe, general advice and lifestyle modifications.

### RULES:
- Use simplified, empathetic language suitable for a patient.
- Do NOT provide a final diagnosis or prescribe medication.
- Always include a disclaimer that this is not a substitute for professional medical advice.`;

    // Convert chat history to Gemini format (strictly typed for SDK)
    const chatHistory = validHistory.map((msg) => ({
      role: msg.role === "user" ? "user" as const : "model" as const,
      parts: [{ text: msg.content.trim() }],
    }));

    const { text, modelUsed } = await executeWithFallback(
      genAI,
      async (model) => {
        const chat = model.startChat({
          history: chatHistory.length > 0 ? chatHistory : undefined,
        });
        const result = await chat.sendMessage(userMessage.trim());
        return result.response.text();
      },
      systemInstruction
    );

    console.log(`Chat response generated with model: ${modelUsed}`);
    return formatMedicalReport(text);

  } catch (error: any) {
    console.error("AI Error Details:", error);

    // Handle specific error types
    if (error.message?.includes('timeout')) {
      return "I'm taking longer than expected to respond. Please try again in a moment.";
    }

    if (error.message?.includes('quota') || error.message?.includes('429')) {
      return "I've reached my usage limit for now. Please try again in a few minutes.";
    }

    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return "I'm having trouble connecting to my AI service. Please check your internet connection and try again.";
    }

    const errorMsg = error.message || "Unknown error occurred";

    // BASIC FALLBACK DICTIONARY (Run if AI fails completely)
    const lowerMsg = userMessage.toLowerCase();
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) return "Hello! I am your AI clinical assistant. How can I help you regarding your symptoms or medications today?";
    if (lowerMsg.includes('thank')) return "You're welcome. Please take care and follow your prescribed plan.";
    if (lowerMsg.includes('pain') || lowerMsg.includes('hurt')) return "I understand you are in pain. Please monitor the intensity. If it exceeds 7/10 or is sudden/severe, please visit the ER immediately. Otherwise, rest and follow your doctor's advice.";
    if (lowerMsg.includes('medication') || lowerMsg.includes('drug') || lowerMsg.includes('dose')) return "Regarding medications: Please strictly follow the prescription given by your doctor. Do not change doses without consulting them.";

    return `I'm having trouble connecting to my AI brain right now. Please check your internet connection or try again later. (Error: ${errorMsg})`;
  }
};

/**
 * Check drug interactions via AI when offline database lacks data
 */
/**
 * Check drug interactions via AI - DEPRECATED / DISABLED
 * Strictly enforced to returns null to ensure Single Source of Truth via deterministic service.
 */
export const checkDrugInteractionsViaAI = async (drug1: string, drug2: string): Promise<DrugInteraction | null> => {
  // STRICT COMPLIANCE: AI is not allowed to determine interactions.
  // Use enhancedDrugInteractionService.checkAllInteractions instead.
  return null;
};

/**
 * Persist newly learned drug interactions to the extended database
 * In a real app, this would call an API to save to a DB. 
 * Here we acknowledge the 'learning' intent.
 */
export const learnNewDrugInteraction = async (interaction: DrugInteraction) => {
  console.log(`🧠 AI LEARNING: Found new interaction between ${interaction.drug1} and ${interaction.drug2}`);
  // Future: Append to custom storage file if env permits
};

/**
 * Generate patient-friendly AI analysis report (no drug information)
 * Focuses on complaints, lifestyle, and general health guidance
 */
export const generatePatientFriendlyReport = async (patient: Patient): Promise<string> => {
  try {
    if (!API_KEY) {
      return "API Key missing. Please ensure GEMINI_API_KEY is set in your .env.local file.";
    }

    const genAI = new GoogleGenerativeAI(API_KEY);

    const prompt = `
PATIENT CLINICAL PROFILE:
- Name: ${patient.fullName}
- Age/Sex: ${patient.age}y / ${patient.sex}
- Height/Weight: ${patient.height}cm / ${patient.weight}kg
- Chief Complaints: ${patient.complaints || "Not provided"}
- Medical History: ${patient.medicalHistory || "Not provided"}
- Family History: ${patient.familyHistory || "Not provided"}
- Social History: Smoking: ${patient.socialHistory.smoking ? 'Yes' : 'No'}, Alcohol: ${patient.socialHistory.alcohol ? 'Yes' : 'No'}, Tobacco: ${patient.socialHistory.tobacco ? 'Yes' : 'No'}

BASELINE VITALS:
- BP: ${patient.baselineVitals.bp || 'N/A'}
- HR: ${patient.baselineVitals.hr || 'N/A'}
- Temperature: ${patient.baselineVitals.temp || 'N/A'}
- SpO2: ${patient.baselineVitals.spo2 || 'N/A'}

LAB RESULTS:
- WBC: ${patient.baselineLabs?.wbc || 'N/A'}
- Platelets: ${patient.baselineLabs?.platelets || 'N/A'}
- RBC: ${patient.baselineLabs?.rbc || 'N/A'}
- Creatinine: ${patient.baselineLabs?.creatinine || 'N/A'}
- Hemoglobin: ${patient.baselineLabs?.hemoglobin || 'N/A'}
- ESR: ${patient.baselineLabs?.esr || 'N/A'}
- MCH: ${patient.baselineLabs?.mch || 'N/A'}
- MCHC: ${patient.baselineLabs?.mchc || 'N/A'}
- MCV: ${patient.baselineLabs?.mcv || 'N/A'}
- Blood Sugar: ${patient.baselineLabs?.bloodSugar || 'N/A'}
- Sodium: ${patient.baselineLabs?.sodium || 'N/A'}
- Potassium: ${patient.baselineLabs?.potassium || 'N/A'}
- Triglycerides/VLDL: ${patient.baselineLabs?.triglycerides || 'N/A'}
- BUN: ${patient.baselineLabs?.bloodUreaNitrogen || 'N/A'}
- SGOT/AST: ${patient.baselineLabs?.sgot || 'N/A'}
- SGPT/ALT: ${patient.baselineLabs?.sgpt || 'N/A'}

IMAGING & OTHER FINDINGS:
${patient.otherFindings || 'No imaging findings provided'}

TASK: You are a caring, experienced doctor speaking directly to your patient. Generate a health report that feels like a warm conversation.

TONE: Imagine you're sitting with the patient, explaining things in a kind, reassuring way. Be professional but approachable.
- Use "you" and "your" to speak directly to the patient
- Show empathy and understanding
- Explain medical concepts in everyday language
- Be honest but reassuring
- Avoid clinical jargon unless you immediately explain it

DO NOT mention any specific medications, drugs, or prescription information.

PATIENT-FRIENDLY REPORT STRUCTURE:

1. **Understanding Your Health** (What's Going On):
   - Start with: "Let me explain what we're seeing with your health..."
   - Explain their condition in simple, clear terms
   - Address their main concerns directly
   - Be reassuring where appropriate
   - Example: "Based on your symptoms and tests, here's what I'm seeing..."

2. **Important Safety Steps** (What You Need to Do):
   - Use phrases like: "Here's what's really important for you to do..."
   - Give clear, actionable safety instructions
   - Emphasize medication adherence without naming specific drugs
   - Include any hygiene or isolation measures
   - Example: "Please make sure to take your medications exactly as prescribed..."

3. **Your Wellness Plan** (How to Feel Better):
   - Start with: "Here are some things that will help you feel better..."
   - Provide specific diet suggestions
   - Give practical exercise and activity advice
   - Include sleep and stress management tips
   - Make it feel achievable, not overwhelming

4. **When to Reach Out** (Warning Signs):
   - Use: "Please contact us right away if you notice..."
   - List clear warning signs in plain language
   - Explain what symptoms need immediate attention
   - Make it clear when to call vs. when to go to ER

5. **We're Here for You** (Doctor's Assurance):
   - MUST include: "We are with you. Don't worry, your health is our priority and we will monitor your progress closely."
   - Add personal, encouraging words about their recovery
   - Show confidence in their ability to get better
   - Example: "You're doing the right things, and I'm confident we'll see improvement..."

IMPORTANT:
- Write like you're talking to a friend or family member
- Show you care about them as a person, not just a patient
- Be specific and practical, not vague
- Include a disclaimer about consulting healthcare providers
- End on an encouraging, hopeful note`;

    const { text, modelUsed } = await executeWithFallback(
      genAI,
      async (model) => {
        const result = await model.generateContent(`${SYSTEM_PROMPT}\n\n${prompt}`);
        return result.response.text();
      }
    );

    console.log(`Patient-friendly report generated with model: ${modelUsed}`);
    return formatMedicalReport(text);

  } catch (error: any) {
    console.error("Patient Report Error:", error);
    return `Error generating patient report: ${error.message || "Unknown error"}. Please check your API key and try again.`;
  }
}

/**
 * Enhanced medical condition detection with keyword-based logic
 */
function detectMedicalConditions(complaints: string, vitals: any, labs: any, medications: any[]): string[] {
  const detected: string[] = [];
  const allText = `${complaints} ${vitals.bp} ${vitals.hr} ${labs.creatinine} ${medications.map(m => m.name).join(' ')}`.toLowerCase();

  // Enhanced medical keywords for better detection
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

/**
 * Enhanced fallback clinical analysis for when AI service is unavailable
 * Provides comprehensive logic-based analysis with detailed clinical insights
 */

/**
 * AI-First Clinical Analysis System
 * 
 * ARCHITECTURE DECISIONS:
 * 1. AI is ALWAYS attempted FIRST on every request
 * 2. Logic-based analysis is ONLY used as temporary fallback for failed requests
 * 3. NO persistent state or memory of AI failures
 * 4. Automatic recovery - next request always tries AI first
 * 5. No manual intervention or configuration required
 * 
 * RECOVERY BEHAVIOR:
 * - AI retry happens IMMEDIATE on next request (no cooldown)
 * - Only the failed request uses logic-based fallback
 * - System automatically returns to AI on subsequent requests
 * - Users never need to manually switch modes or reset
 */

/**
 * Generate comprehensive safety report for HCP Portal
 * AI-FIRST: Always attempts AI analysis first, logic-based fallback only for temporary failures
 * AUTOMATIC RECOVERY: Next request always tries AI first, no persistent failure state
 */
export async function generateSafetyReport(patient: Patient): Promise<string> {
  try {
    // GROK-FIRST DECISION: Always attempt Grok analysis first for better clinical reasoning
    console.log('🤖 GROK-FIRST: Attempting Grok clinical analysis...');

    try {
      const grokResult = await grokService.generateClinicalAnalysis(patient);
      if (grokResult.success && grokResult.analysis) {
        console.log('✅ GROK SUCCESS: Clinical analysis generated with Grok');
        return grokResult.analysis;
      }
      console.log('⚠️ GROK failed or returned empty, trying Gemini...');
    } catch (grokError) {
      console.log('⚠️ GROK service error:', grokError);
      console.log('🔄 Falling back to Gemini...');
    }

    // GEMINI FALLBACK: Try Gemini if Grok fails
    console.log('🤖 GEMINI FALLBACK: Attempting Gemini clinical analysis...');

    // Use the robustly retrieved global API_KEY
    // Use the robustly retrieved global API_KEY
    if (!API_KEY) {
      console.log('❌ AI unavailable: Missing API key, using enhanced fallback');
      console.log('💡 To enable AI: Add GEMINI_API_KEY or VITE_GEMINI_API_KEY to your environment variables');
      return generateEnhancedClinicalAnalysis(patient);
    }

    // ------------------------------------------------------------------
    // STRICT RULE: Use deterministic code lookup for interactions
    // ------------------------------------------------------------------
    const medicationNames = patient.medications?.map(m => m.name) || [];
    const interactionResults = await enhancedDrugInteractionService.checkAllInteractions(medicationNames);

    const formattedInteractions = interactionResults.length > 0
      ? interactionResults.map(i =>
        `- ${i.drug1} + ${i.drug2} (${i.severity.toUpperCase()}): ${i.description}`
      ).join("\n")
      : "No interaction found in the validated database.";

    // Enhanced comprehensive prompt for detailed clinical analysis
    const comprehensivePrompt = `You are an expert clinical physician providing a comprehensive medical analysis. Please analyze this patient case thoroughly:

PATIENT INFORMATION:
- Name: ${patient.fullName}
- Age: ${patient.age} years
- Sex: ${patient.sex}
- Height: ${patient.height}
- Weight: ${patient.weight}

CHIEF COMPLAINTS:
${patient.complaints}

CLINICAL EXAMINATION FINDINGS:
${patient.treatmentContext?.includes('EXAMINATION FINDINGS:') ? patient.treatmentContext.split('EXAMINATION FINDINGS:')[1]?.trim() || 'No specific examination findings recorded' : 'No specific examination findings recorded'}

VITAL SIGNS:
- Blood Pressure: ${patient.baselineVitals.bp}
- Heart Rate: ${patient.baselineVitals.hr}
- Temperature: ${patient.baselineVitals.temp}
- Oxygen Saturation: ${patient.baselineVitals.spo2}

LABORATORY RESULTS:
- WBC: ${patient.baselineLabs?.wbc || 'Not recorded'}
- Platelets: ${patient.baselineLabs?.platelets || 'Not recorded'}
- RBC: ${patient.baselineLabs?.rbc || 'Not recorded'}
- Creatinine: ${patient.baselineLabs?.creatinine || 'Not recorded'}

MEDICAL HISTORY:
${patient.medicalHistory}

FAMILY HISTORY:
${patient.familyHistory}

CURRENT MEDICATIONS:
${patient.medications.map(m => `- ${m.name} ${m.dose} via ${m.route} (${m.frequency})`).join('\n') || 'None recorded'}

SOCIAL HISTORY:
- Smoking: ${patient.socialHistory.smoking ? 'Yes' : 'No'}
- Alcohol: ${patient.socialHistory.alcohol ? 'Yes' : 'No'}
- Tobacco: ${patient.socialHistory.tobacco ? 'Yes' : 'No'}

**DETECTED DRUG INTERACTIONS (STRICT FACTUAL DATA):**
${formattedInteractions}

Please provide a COMPREHENSIVE clinical analysis with the following sections:

1. CLINICAL ASSESSMENT
   - Primary clinical impression
   - Severity assessment (Mild/Moderate/Severe/Critical)
   - Urgency level (Routine/Urgent/Emergency)

2. DIFFERENTIAL DIAGNOSIS
   - Top 3 most likely diagnoses
   - Rationale for each
   - Key distinguishing features

3. RECOMMENDED INVESTIGATIONS
   - Immediate tests needed
   - Follow-up investigations
   - Monitoring requirements

4. TREATMENT PLAN
   - Immediate interventions
   - Medication recommendations
   - Non-pharmacological measures

5. DRUG RECOMMENDATIONS & SAFETY
   - Specific medications with dosages
   - Alternative options
   - **Explain the DETECTED INTERACTIONS listed above.**
   - **DO NOT** suggest interactions not listed in the DETECTED DRUG INTERACTIONS section.

6. MONITORING & FOLLOW-UP
   - Vital signs monitoring
   - Warning signs/symptoms
   - Follow-up timeline

7. PATIENT EDUCATION
   - Key information for patient
   - Lifestyle modifications
   - Warning symptoms

8. PATIENT-FRIENDLY DISCHARGE SUMMARY (Required for Patient Portal)
   - SEPARATOR: "--- Patient-Friendly ---"
   - **Condition Details**: Simple explanation of what is happening.
   - **Safety Measures**: Specific safety and hygiene instructions.
   - **Lifestyle Modifications**: Diet, exercise, and sleep advice.
   - **Safety Calls**: When to seek help / red flags.
   - **Doctor's Assurance**: REQUIRED PHRASE: "We are with you. Don't worry, your health is our priority and we will monitor your progress closely."

Provide detailed, specific recommendations suitable for clinical practice. Use medical terminology appropriately but ensure clarity.`;

    const genAI = new GoogleGenerativeAI(API_KEY);

    // AI-FIRST: Attempt AI analysis with retry logic using central fallback system
    const { text, modelUsed } = await executeWithFallback(
      genAI,
      async (model) => {
        const result = await model.generateContent(comprehensivePrompt);
        return result.response.text();
      }
    );

    if (text && text.trim().length > 0 && modelUsed !== "none") {
      console.log(`✅ AI SUCCESS: Clinical analysis generated with ${modelUsed}`);
      return text;
    }

    // TEMPORARY FALLBACK: Use enhanced logic-based analysis ONLY for this failed request
    console.log('🔄 FALLBACK TRIGGERED: AI failed or returned error, using logic-based analysis');
    return generateEnhancedClinicalAnalysis(patient);

  } catch (error: any) {
    console.error("❌ SYSTEM ERROR: Critical error in generateSafetyReport:", error);

    // Handle specific error types
    if (error.message?.includes('timeout')) {
      console.log('🔄 TIMEOUT FALLBACK: Using enhanced logic-based analysis due to timeout');
      return generateEnhancedClinicalAnalysis(patient);
    }

    console.log('🔄 ERROR FALLBACK: Using enhanced logic-based analysis due to system error');
    return generateEnhancedClinicalAnalysis(patient);
  }
}
