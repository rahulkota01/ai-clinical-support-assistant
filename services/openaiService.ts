import OpenAI from 'openai';
import { ChatMessage, Patient } from '../types';
import { SYSTEM_PROMPT } from '../constants_temp';
import { enhancedDrugInteractionService } from './enhancedDrugInteractionService';

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

const openai = new OpenAI({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true, // Required for client-side usage
});

/**
 * Get AI response for chat conversations (Virtual AI Doctor)
 * Uses OpenAI's GPT-4 for reliable responses
 */
export const getAIResponse = async (
  history: ChatMessage[],
  userMessage: string,
  patientContext?: Patient
): Promise<string> => {
  try {
    if (!API_KEY) {
      console.error("OpenAI API Key missing. Check .env.local file.");
      return "API Key missing. Please configure VITE_OPENAI_API_KEY in .env.local";
    }

    // Build patient context if available
    const context = patientContext ? `
### PATIENT CLINICAL PROFILE (CRITICAL CONTEXT):
You are speaking with this specific patient. All your answers must be tailored to their profile.

- **Demographics:** ${patientContext.age} years old, ${patientContext.sex}
- **Chief Complaint (on admission):** ${patientContext.complaints || "None recorded"}
- **Medical History:** ${patientContext.medicalHistory || "None recorded"}
- **Current Medications:** ${patientContext.medications?.map(m => `${m.name} (${m.dose}, ${m.route}, ${m.frequency})`).join("; ") || "None"}
- **Baseline Vitals:** BP: ${patientContext.baselineVitals?.bp || 'N/A'}, HR: ${patientContext.baselineVitals?.hr || 'N/A'}, Temp: ${patientContext.baselineVitals?.temp || 'N/A'}, SpO2: ${patientContext.baselineVitals?.spo2 || 'N/A'}
` : "";


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

    // Convert chat history to OpenAI format
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemInstruction },
      ...history.map((msg) => ({
        role: msg.role === "user" ? "user" as const : "assistant" as const,
        content: msg.content,
      })),
      { role: 'user', content: userMessage }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using GPT-4o-mini for cost efficiency
      messages,
      max_tokens: 2000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("Empty response from OpenAI");
    }

    console.log(`Chat response generated with OpenAI GPT-4o-mini`);
    return response;

  } catch (error: any) {
    console.error("OpenAI Error Details:", error);
    const errorMsg = error.message || "Unknown error occurred";
    return `I'm having trouble connecting right now. Error: ${errorMsg}. Please check your API key configuration or try again later.`;
  }
};

/**
 * Generate comprehensive safety report for HCP Portal
 * Analyzes drug-drug interactions, ADRs, and clinical safety using OpenAI
 */
export const generateSafetyReport = async (patient: Patient): Promise<string> => {
  try {
    if (!API_KEY) {
      throw new Error("OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env.local file.");
    }

    // Build comprehensive patient context
    const medicationsList = patient.medications?.map(m =>
      `- ${m.name}: ${m.dose} via ${m.route}, ${m.frequency}`
    ).join("\n") || "None recorded";

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

CURRENT MEDICATIONS:
${medicationsList}

**DETECTED DRUG INTERACTIONS (STRICT FACTUAL DATA - DO NOT HALLUCINATE OR MODIFY):**
${formattedInteractions}

TASK: Act as a Senior Clinical Consultant. Generate a comprehensive, structured clinical report.
The report should be professional yet understandable, suitable for explaining to the patient while maintaining clinical accuracy.
Use the DETECTED INTERACTION DATA above as the single source of truth for the interaction section.

REPORT STRUCTURE:
1. **Patient Vitals & BMI Analysis**:
   - Calculate BMI from Height/Weight (if available).
   - Analyze vitals (BP, HR, Temp, SpO2) against normal ranges.

2. **Clinical Assessment & Differential Diagnosis**:
   - Based on complaints, history, and vitals, provide potential differential diagnoses.
   - Explain the reasoning clearly.

3. **Medication Review (Uses, Side Effects, Potential)**:
   - For each medication: Indication (Use), Mechanism (Potential), and Common Side Effects.
   - Highlight any "Drug Potential" or efficacy considerations.

4. **Drug-Drug Interactions & Safety Warnings**:
   - **USE ONLY** the interactions provided in the "DETECTED DRUG INTERACTIONS" section above.
   - Explain these known interactions to the user clearly.
   - If "No interaction found", state that no database interactions were detected.
   - List major Adverse Drug Reactions (ADRs) to watch for based on individual drugs.

5. **Lifestyle & Dietary Modifications**:
   - Specific recommendations based on the condition and medications (e.g., diet, exercise, sleep).

6. **Clinical Optimization & Suggestions**:
   - "AI Suggestions Box": Recommendations to enhance treatment efficacy or patient safety.
   - Next steps or tests to consider.

TONE: Professional, Empathetic, Authoritative yet Explanatory.
DISCLAIMER: Include a standard medical disclaimer at the end.`;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 3000,
      temperature: 0.3, // Lower temperature for more consistent clinical reports
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("Empty response from OpenAI");
    }

    console.log(`Safety report generated with OpenAI GPT-4o-mini`);
    return response;

  } catch (error: any) {
    console.error("OpenAI Safety Report Error:", error);
    return `Error generating safety report: ${error.message || "Unknown error"}. Please check your API key and try again.`;
  }
};

/**
 * Analyze drug names for interactions, ADRs, and clinical information
 * Used for drug-name based analysis in HCP Portal
 */
export const analyzeDrugs = async (drugNames: string[]): Promise<string> => {
  try {
    if (!API_KEY) {
      return "API Key missing. Check .env.local";
    }

    if (!drugNames || drugNames.length === 0) {
      return "No drug names provided for analysis.";
    }

    const drugsList = drugNames.join(", ");

    // ------------------------------------------------------------------
    // STRICT RULE: Use deterministic code lookup for interactions
    // ------------------------------------------------------------------
    const interactionResults = await enhancedDrugInteractionService.checkAllInteractions(drugNames);

    const formattedInteractions = interactionResults.length > 0
      ? interactionResults.map(i =>
        `- ${i.drug1} + ${i.drug2} (${i.severity.toUpperCase()}): ${i.description}`
      ).join("\n")
      : "No interaction found in the validated database.";

    const systemInstruction = `You are a Clinical Pharmacologist providing academic/research analysis.
Provide a structured analysis with the following sections:

1. DRUG-WISE SUMMARY
For each drug, provide:
- Primary uses/indications
- Common adverse drug reactions (ADRs)

2. DRUG-DRUG INTERACTIONS (STRICTLY BASED ON PROVIDED DATA)
**DETECTED INTERACTIONS:**
${formattedInteractions}

INSTRUCTIONS FOR THIS SECTION:
- EXPLAIN the interactions listed above in academic terms.
- **DO NOT** suggest or hallucinate new interactions that are not listed above.
- If the list says "No interaction found", state "No significant interactions detected in the standard database."

3. ADVERSE EFFECTS
- Common side effects
- Rare but important adverse effects
- Warnings and precautions

4. CLINICAL USE OVERVIEW
- Academic-level overview of clinical applications
- Important considerations for clinical practice

5. ACADEMIC DISCLAIMER
Include: "This analysis is AI-generated for educational purposes only. Not for medical diagnosis or treatment decisions."

IMPORTANT:
- NO dosage information
- NO prescription recommendations
- Focus on academic/research insight only
- Be clear and structured in your response`;

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: `DRUGS TO ANALYZE: ${drugsList}` }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 2000,
      temperature: 0.2, // Very low temperature for factual drug analysis
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("Empty response from OpenAI");
    }

    console.log(`Drug analysis generated with OpenAI GPT-4o-mini`);
    return response;

  } catch (error: any) {
    console.error("OpenAI Drug Analysis Error:", error);
    return `Error analyzing drugs: ${error.message || "Unknown error"}. Please check your API key and try again.`;
  }
};
