/**
 * AI-First Clinical Analysis Service
 * Uses Grok AI for patient-specific reasoning before falling back to logic functions
 */

import { Patient } from '../types';
import { grokService } from './grokService';
import { generateEnhancedClinicalAnalysis } from './enhancedClinicalLogic';

export interface ClinicalAnalysisResult {
  success: boolean;
  analysis: string;
  patientFriendlyMessage?: string;
  confidence: number;
  source: 'ai' | 'logic';
  error?: string;
}

/**
 * AI-First Clinical Analysis
 * Attempts Grok AI analysis first, falls back to logic if AI fails
 */
export async function performClinicalAnalysis(patient: Patient): Promise<ClinicalAnalysisResult> {
  try {
    // First, try Grok AI analysis
    console.log('Attempting Grok AI clinical analysis...');
    const grokResult = await grokService.generateClinicalAnalysis(patient);

    if (grokResult.success && grokResult.analysis) {
      console.log('Grok AI analysis successful');
      return {
        success: true,
        analysis: grokResult.analysis,
        patientFriendlyMessage: grokResult.patientFriendlyMessage,
        confidence: 85, // High confidence for AI analysis
        source: 'ai'
      };
    }

    // Fallback to logic-based analysis
    console.log('Grok AI failed, falling back to logic analysis:', grokResult.error);
    const logicAnalysis = generateEnhancedClinicalAnalysis(patient);

    return {
      success: true,
      analysis: logicAnalysis,
      confidence: 65, // Moderate confidence for logic analysis
      source: 'logic'
    };

  } catch (error) {
    console.error('Clinical analysis error:', error);

    // Final fallback - basic logic analysis
    try {
      const logicAnalysis = generateEnhancedClinicalAnalysis(patient);
      return {
        success: true,
        analysis: logicAnalysis,
        confidence: 50, // Low confidence for error fallback
        source: 'logic',
        error: error instanceof Error ? error.message : 'Unknown analysis error'
      };
    } catch (fallbackError) {
      return {
        success: false,
        analysis: '',
        confidence: 0,
        source: 'logic',
        error: 'Complete analysis failure'
      };
    }
  }
}

/**
 * Quick AI Health Check for symptoms
 */
export async function quickAIHealthCheck(symptoms: string): Promise<{success: boolean, advice?: string, error?: string}> {
  try {
    const result = await grokService.quickHealthCheck(symptoms);
    return {
      success: result.success,
      advice: result.analysis,
      error: result.error
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed'
    };
  }
}
