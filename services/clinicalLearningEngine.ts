// Clinical Learning Engine - AI Logic Improvement System
// Learns from case reviews to enhance clinical analysis accuracy

interface ClinicalCase {
  caseMetadata: {
    caseId: string;
    date: string;
    specialty: string;
    reviewer: string;
  };
  patientContext: {
    ageGroup: string;
    sex: string;
    majorRiskFactors: string[];
    relevantComorbidities: Record<string, boolean>;
  };
  presentation: {
    chiefComplaint: string;
    symptomOnset: string;
    duration: string;
    redFlagSymptoms: {
      present: boolean;
      symptoms: string[];
    };
  };
  keyFindings: {
    vitalSignCategory: string;
    imagingSummary?: string;
    labsSummary: string;
  };
  systemOutput: {
    riskCategoryAssigned: string;
    keyInterpretationGenerated: string;
    medicationConsiderationsSuggested: string[];
    confidenceLevel: number;
  };
  reviewerFeedback: {
    wasRiskClassificationAppropriate: string;
    missedRedFlags: string[];
    unnecessaryAlarm: boolean;
    wereMedicationConsiderationsReasonable: string;
    comments: string;
  };
  logicRefinementNotes: {
    ruleToAdjust?: string;
    newConditionPatternIdentified: boolean;
    thresholdAdjustment?: string;
    actionItem: string;
  };
}

interface LearningMetrics {
  totalCases: number;
  accuracyByRiskCategory: Record<string, number>;
  accuracyBySpecialty: Record<string, number>;
  confidenceCalibration: {
    averageConfidence: number;
    actualAccuracy: number;
    overconfidence: number;
  };
  commonPatterns: Record<string, number>;
  improvementAreas: string[];
}

class ClinicalLearningEngine {
  private cases: ClinicalCase[] = [];
  private learningMetrics: LearningMetrics;
  private patternDatabase: Map<string, ClinicalCase[]> = new Map();
  private riskThresholds: Map<string, { min: number; max: number }> = new Map();

  constructor() {
    this.learningMetrics = {
      totalCases: 0,
      accuracyByRiskCategory: { routine: 0, urgent: 0, emergency: 0 },
      accuracyBySpecialty: {},
      confidenceCalibration: {
        averageConfidence: 0,
        actualAccuracy: 0,
        overconfidence: 0
      },
      commonPatterns: {},
      improvementAreas: []
    };
    
    // Initialize default risk thresholds
    this.riskThresholds.set('emergency', { min: 85, max: 100 });
    this.riskThresholds.set('urgent', { min: 60, max: 84 });
    this.riskThresholds.set('routine', { min: 0, max: 59 });
  }

  // Add new case review for learning
  addCaseReview(caseReview: ClinicalCase): void {
    this.cases.push(caseReview);
    this.updateMetrics(caseReview);
    this.updatePatterns(caseReview);
    this.adjustThresholds(caseReview);
    this.saveToDatabase();
  }

  // Update learning metrics from new case
  private updateMetrics(caseReview: ClinicalCase): void {
    this.learningMetrics.totalCases++;
    
    // Update accuracy by risk category
    const riskCategory = caseReview.systemOutput.riskCategoryAssigned;
    const wasCorrect = caseReview.reviewerFeedback.wasRiskClassificationAppropriate === 'yes';
    this.learningMetrics.accuracyByRiskCategory[riskCategory] = 
      (this.learningMetrics.accuracyByRiskCategory[riskCategory] || 0) + (wasCorrect ? 1 : 0);
    
    // Update accuracy by specialty
    const specialty = caseReview.caseMetadata.specialty;
    this.learningMetrics.accuracyBySpecialty[specialty] = 
      (this.learningMetrics.accuracyBySpecialty[specialty] || 0) + (wasCorrect ? 1 : 0);
    
    // Update confidence calibration
    this.learningMetrics.confidenceCalibration.averageConfidence = 
      (this.learningMetrics.confidenceCalibration.averageConfidence * (this.learningMetrics.totalCases - 1) + 
       caseReview.systemOutput.confidenceLevel) / this.learningMetrics.totalCases;
    
    this.learningMetrics.confidenceCalibration.actualAccuracy = 
      (this.learningMetrics.confidenceCalibration.actualAccuracy * (this.learningMetrics.totalCases - 1) + 
       (wasCorrect ? 100 : 0)) / this.learningMetrics.totalCases;
    
    this.learningMetrics.confidenceCalibration.overconfidence = 
      this.learningMetrics.confidenceCalibration.averageConfidence - 
      this.learningMetrics.confidenceCalibration.actualAccuracy;
  }

  // Update pattern database
  private updatePatterns(caseReview: ClinicalCase): void {
    const patternKey = this.generatePatternKey(caseReview);
    
    if (!this.patternDatabase.has(patternKey)) {
      this.patternDatabase.set(patternKey, []);
    }
    
    this.patternDatabase.get(patternKey)!.push(caseReview);
    
    // Update common patterns count
    this.learningMetrics.commonPatterns[patternKey] = 
      (this.learningMetrics.commonPatterns[patternKey] || 0) + 1;
  }

  // Generate pattern key for case clustering
  private generatePatternKey(caseReview: ClinicalCase): string {
    const { chiefComplaint, redFlagSymptoms } = caseReview.presentation;
    const { labsSummary } = caseReview.keyFindings;
    const { majorRiskFactors } = caseReview.patientContext;
    
    return `${chiefComplaint.substring(0, 20)}_${redFlagSymptoms.present ? 'RF' : 'NoRF'}_${labsSummary}_${majorRiskFactors.join('-')}`;
  }

  // Adjust risk thresholds based on feedback
  private adjustThresholds(caseReview: ClinicalCase): void {
    const { thresholdAdjustment, newConditionPatternIdentified } = caseReview.logicRefinementNotes;
    
    if (thresholdAdjustment) {
      const riskCategory = caseReview.systemOutput.riskCategoryAssigned;
      const currentThreshold = this.riskThresholds.get(riskCategory);
      
      if (currentThreshold && thresholdAdjustment === 'higher') {
        currentThreshold.min += 5;
      } else if (currentThreshold && thresholdAdjustment === 'lower') {
        currentThreshold.min -= 5;
      }
    }
    
    if (newConditionPatternIdentified) {
      this.learningMetrics.improvementAreas.push(
        `New pattern: ${caseReview.presentation.chiefComplaint} - ${caseReview.caseMetadata.caseId}`
      );
    }
  }

  // Get enhanced clinical analysis based on learned patterns
  getEnhancedAnalysis(patientData: any): {
    riskCategory: string;
    confidence: number;
    recommendations: string[];
    similarCases: ClinicalCase[];
    accuracyEstimate: number;
  } {
    const patternKey = this.generatePatternKeyFromPatient(patientData);
    const similarCases = this.patternDatabase.get(patternKey) || [];
    
    // Calculate risk based on learned patterns
    const riskCategory = this.calculateRiskCategory(patientData, similarCases);
    const confidence = this.calculateConfidence(patientData, similarCases, riskCategory);
    const recommendations = this.getRecommendations(patientData, similarCases);
    const accuracyEstimate = this.estimateAccuracy(similarCases, riskCategory);
    
    return {
      riskCategory,
      confidence,
      recommendations,
      similarCases,
      accuracyEstimate
    };
  }

  // Calculate risk category based on learned patterns
  private calculateRiskCategory(patientData: any, similarCases: ClinicalCase[]): string {
    // Base risk calculation
    let riskScore = 0;
    
    // Red flag symptoms
    if (patientData.redFlagSymptoms?.present) {
      riskScore += 40;
    }
    
    // Abnormal vitals
    if (patientData.vitalSignCategory === 'abnormal') {
      riskScore += 30;
    }
    
    // Critical labs
    if (patientData.labsSummary === 'critical') {
      riskScore += 30;
    }
    
    // Adjust based on similar cases
    if (similarCases.length > 0) {
      const correctClassifications = similarCases.filter(
        c => c.reviewerFeedback.wasRiskClassificationAppropriate === 'yes'
      ).length;
      
      const accuracy = correctClassifications / similarCases.length;
      
      // If similar cases have high accuracy, trust the pattern
      if (accuracy > 0.9) {
        const mostCommonRisk = this.getMostCommonRiskCategory(similarCases);
        return mostCommonRisk;
      }
    }
    
    // Convert score to category
    if (riskScore >= 85) return 'emergency';
    if (riskScore >= 60) return 'urgent';
    return 'routine';
  }

  // Calculate confidence based on patterns
  private calculateConfidence(patientData: any, similarCases: ClinicalCase[], riskCategory: string): number {
    let baseConfidence = 70;
    
    // Increase confidence with more similar cases
    if (similarCases.length > 0) {
      baseConfidence += Math.min(similarCases.length * 5, 20);
    }
    
    // Adjust based on historical accuracy for this risk category
    const accuracy = this.learningMetrics.accuracyByRiskCategory[riskCategory] || 0;
    const totalCases = Object.values(this.learningMetrics.accuracyByRiskCategory).reduce((a, b) => a + b, 0);
    
    if (totalCases > 0) {
      const accuracyRate = accuracy / totalCases;
      baseConfidence += (accuracyRate - 0.5) * 30;
    }
    
    // Calibrate confidence based on learning metrics
    const overconfidence = this.learningMetrics.confidenceCalibration.overconfidence;
    baseConfidence -= overconfidence;
    
    return Math.max(50, Math.min(95, Math.round(baseConfidence)));
  }

  // Get recommendations based on similar cases
  private getRecommendations(patientData: any, similarCases: ClinicalCase[]): string[] {
    const recommendations: string[] = [];
    
    // Add recommendations from similar successful cases
    similarCases
      .filter(c => c.reviewerFeedback.wereMedicationConsiderationsReasonable === 'yes')
      .forEach(c => {
        c.systemOutput.medicationConsiderationsSuggested.forEach(med => {
          if (!recommendations.includes(med)) {
            recommendations.push(med);
          }
        });
      });
    
    // Add recommendations based on learned patterns
    if (patientData.labsSummary === 'critical') {
      recommendations.push('Immediate laboratory follow-up required');
    }
    
    if (patientData.redFlagSymptoms?.present) {
      recommendations.push('Urgent specialist consultation recommended');
    }
    
    return recommendations;
  }

  // Estimate accuracy based on similar cases
  private estimateAccuracy(similarCases: ClinicalCase[], riskCategory: string): number {
    if (similarCases.length === 0) {
      return 75; // Default accuracy
    }
    
    const correctClassifications = similarCases.filter(
      c => c.reviewerFeedback.wasRiskClassificationAppropriate === 'yes'
    ).length;
    
    return Math.round((correctClassifications / similarCases.length) * 100);
  }

  // Get most common risk category from similar cases
  private getMostCommonRiskCategory(similarCases: ClinicalCase[]): string {
    const riskCounts = similarCases.reduce((acc, c) => {
      acc[c.systemOutput.riskCategoryAssigned] = (acc[c.systemOutput.riskCategoryAssigned] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(riskCounts).sort(([,a], [,b]) => b - a)[0][0];
  }

  // Generate pattern key from patient data
  private generatePatternKeyFromPatient(patientData: any): string {
    const chiefComplaint = patientData.complaints?.substring(0, 20) || '';
    const hasRedFlags = patientData.redFlagSymptoms?.present || false;
    const labsSummary = patientData.labsSummary || 'normal';
    const riskFactors = patientData.riskFactors?.join('-') || '';
    
    return `${chiefComplaint}_${hasRedFlags ? 'RF' : 'NoRF'}_${labsSummary}_${riskFactors}`;
  }

  // Get current learning metrics
  getLearningMetrics(): LearningMetrics {
    return { ...this.learningMetrics };
  }

  // Get improvement suggestions
  getImprovementSuggestions(): string[] {
    const suggestions: string[] = [];
    
    // Check for overconfidence
    if (this.learningMetrics.confidenceCalibration.overconfidence > 10) {
      suggestions.push('Reduce confidence levels - system is overconfident');
    }
    
    // Check for low accuracy areas
    Object.entries(this.learningMetrics.accuracyByRiskCategory).forEach(([category, correct]) => {
      const total = this.learningMetrics.totalCases;
      const accuracy = (correct / total) * 100;
      
      if (accuracy < 80) {
        suggestions.push(`Improve ${category} risk classification accuracy (currently ${accuracy.toFixed(1)}%)`);
      }
    });
    
    // Add improvement areas
    suggestions.push(...this.learningMetrics.improvementAreas);
    
    return suggestions;
  }

  // Save cases to database (simulated)
  private saveToDatabase(): void {
    // In production, this would save to a real database
    console.log('Saving learning data to database...');
    console.log(`Total cases: ${this.learningMetrics.totalCases}`);
    console.log('Learning metrics updated');
  }

  // Load cases from database (simulated)
  loadFromDatabase(): void {
    // In production, this would load from a real database
    console.log('Loading learning data from database...');
  }

  // Export cases for analysis
  exportCases(): ClinicalCase[] {
    return [...this.cases];
  }

  // Import cases for learning
  importCases(cases: ClinicalCase[]): void {
    cases.forEach(caseReview => this.addCaseReview(caseReview));
  }
}

export default ClinicalLearningEngine;
export type { ClinicalCase, LearningMetrics };
