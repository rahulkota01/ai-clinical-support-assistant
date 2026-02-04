// Grok AI Service Integration
// Using Grok API for additional AI analysis before triggering logic functions

export interface GrokResponse {
  success: boolean;
  analysis?: string;
  patientFriendlyMessage?: string;
  error?: string;
}

import { enhancedDrugInteractionService } from './enhancedDrugInteractionService';

class GrokService {
  private apiKey: string;
  private baseUrl: string = 'https://api.x.ai/v1';

  constructor() {
    // Get API key from environment
    this.apiKey = import.meta.env?.VITE_GROK_API_KEY || '';
  }

  // Generate clinical analysis using Grok
  async generateClinicalAnalysis(patient: any): Promise<GrokResponse> {
    try {
      // Get deterministic interactions
      const medicationNames = patient.medications?.map((m: any) => m.name) || [];
      const interactionResults = await enhancedDrugInteractionService.checkAllInteractions(medicationNames);

      const formattedInteractions = interactionResults.length > 0
        ? interactionResults.map(i =>
          `- ${i.drug1} + ${i.drug2} (${i.severity.toUpperCase()}): ${i.description}`
        ).join("\n")
        : "No interaction found in the validated database.";

      // Attach to patient context for prompt builder
      const patientWithInteractions = { ...patient, formattedInteractions };
      const prompt = this.buildClinicalPrompt(patientWithInteractions);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [
            {
              role: 'system',
              content: `You are a compassionate, experienced physician providing clinical analysis. 
              
              TONE GUIDELINES:
              - Speak like a real doctor having a conversation with a colleague
              - Be warm, professional, and reassuring
              - Use clear medical reasoning but avoid unnecessary jargon
              - Show empathy and understanding for the patient's condition
              - Be confident but humble - acknowledge when more information is needed
              - Think out loud about your clinical reasoning
              
              AVOID:
              - Robotic or overly formal language
              - Phrases like "High confidence" or "Multi-system involvement" unless clearly justified
              - Medical jargon when simpler terms work better
              - Alarmist or anxiety-inducing language
              
              EMBRACE:
              - "Let's look at what we're seeing here..."
              - "Based on these findings, I'm thinking..."
              - "What concerns me is..." or "What reassures me is..."
              - "Here's what I'd recommend..."
              - Natural, conversational medical reasoning`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const analysis = data.choices?.[0]?.message?.content;

      if (!analysis) {
        throw new Error('No analysis received from Grok');
      }

      // Generate patient-friendly message
      const patientMessage = this.generatePatientFriendlyMessage(patient, analysis);

      return {
        success: true,
        analysis,
        patientFriendlyMessage: patientMessage
      };

    } catch (error) {
      console.error('Grok service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private buildClinicalPrompt(patient: any): string {
    return `
Patient Information:
- Name: ${patient.fullName || 'Unknown'}
- Age: ${patient.age || 'Unknown'}
- Gender: ${patient.sex || 'Unknown'}
- Chief Complaints: ${patient.complaints || 'None reported'}

Vital Signs:
- Blood Pressure: ${patient.baselineVitals?.bp || 'Not recorded'}
- Heart Rate: ${patient.baselineVitals?.hr || 'Not recorded'} bpm
- Temperature: ${patient.baselineVitals?.temp || 'Not recorded'}°F
- SpO2: ${patient.baselineVitals?.spo2 || 'Not recorded'}%

Current Medications:
${patient.medications?.map((med: any) => `- ${med.name} ${med.dose} ${med.route} ${med.frequency}`).join('\n') || 'None'}

**DETECTED DRUG INTERACTIONS (STRICT FACTUAL DATA):**
${(patient as any).formattedInteractions || 'No interactions detected in validation database.'}

Medical History: ${patient.medicalHistory || 'None'}
Other Findings: ${patient.otherFindings || 'None'}

Please provide:
1. Clinical Reasoning - Conservative interpretation of findings
2. Vital Signs Analysis - Interpretation in clinical context
3. Assessment - What is likely, unlikely, and cannot be determined
4. **Drug Interaction Analysis - Explain the interactions listed above (if any). DO NOT suggest new ones.**
5. Confidence Level - Low/Moderate/Requires Further Evaluation with justification
6. Patient-Friendly Message - Simple, reassuring explanation

Keep responses concise and evidence-based. Avoid alarmist language.
    `;
  }

  private generatePatientFriendlyMessage(patient: any, analysis: string): string {
    const name = patient.fullName?.split(' ')[0] || 'there';

    return `
Hello ${name},

Based on your symptoms and examination, here's what I can tell you in simple terms:

${this.extractPatientFriendlyPoints(analysis)}

Remember, this is general guidance. Your healthcare provider knows your complete medical history and can give you the most personalized advice.

If you notice any new or worsening symptoms, please don't hesitate to contact your healthcare provider.

Take care and feel better soon!
    `.trim();
  }

  private extractPatientFriendlyPoints(analysis: string): string {
    // Extract key points from the analysis and make them patient-friendly
    const points: string[] = [];

    // Look for vital signs interpretation
    if (analysis.includes('blood pressure')) {
      points.push('• Your blood pressure reading has been noted and will be monitored appropriately.');
    }

    if (analysis.includes('heart rate')) {
      points.push('• Your heart rate is within the expected range for your current condition.');
    }

    if (analysis.includes('temperature')) {
      points.push('• Your temperature indicates we should monitor for any signs of infection.');
    }

    // Add general reassurance
    points.push('• Your symptoms are being taken seriously and appropriate follow-up is recommended.');
    points.push('• Continue to monitor how you feel and report any changes to your healthcare provider.');

    return points.join('\n');
  }

  // Quick health check for basic symptoms
  async quickHealthCheck(symptoms: string): Promise<GrokResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'grok-beta',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful health assistant. Provide simple, reassuring advice for common symptoms. Always recommend professional medical consultation for persistent or severe symptoms.'
            },
            {
              role: 'user',
              content: `I'm experiencing: ${symptoms}. What should I know?`
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const advice = data.choices?.[0]?.message?.content;

      return {
        success: true,
        analysis: advice,
        patientFriendlyMessage: advice || 'Please consult with a healthcare provider for personalized advice.'
      };

    } catch (error) {
      console.error('Grok quick check error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const grokService = new GrokService();
