// Enhanced Drug Interaction Service with comprehensive checking
import { drugExtractorService } from './drugExtractor';
import { rxNormService } from './rxnorm';
import { DRUG_DATABASE, INTERACTION_DATABASE, DrugDetail as DBDrugDetail, DrugInteraction } from './drugDatabase';
import { datasetService } from './datasetService';
// Removed AI generation imports to strictly enforce single source of truth rules
// import { checkDrugInteractionsViaAI, learnNewDrugInteraction } from './geminiService';

// Extend the DB/UI types if needed, or just re-export
export type { DrugInteraction };

// The UI might expect 'interactions' on the detail object, or genericName/brandName
export interface DrugDetail extends DBDrugDetail {
  // any extra UI fields if needed
  fullname?: string;
}

class EnhancedDrugInteractionService {
  // Initialize the underlying dataset service
  async init(): Promise<void> {
    await datasetService.init();
  }

  // Check all pairwise interactions for a list of drugs
  async checkAllInteractions(drugNames: string[]): Promise<DrugInteraction[]> {
    // Ensure dataset is loaded
    await datasetService.init();

    const interactions: DrugInteraction[] = [];
    const normalizedDrugs: Array<{ normalized: string, original: string }> = [];

    // Normalize drugs
    for (const drug of drugNames) {
      if (!drug) continue;

      // Try to find in our static small DB first for metadata
      // (This part is preserved from original logic for backward compatibility of names)
      const dbMatch = Object.keys(DRUG_DATABASE).find(k => k.toLowerCase() === drug.toLowerCase());
      let normalizedName = '';

      if (dbMatch) {
        normalizedName = dbMatch;
      } else {
        // Simple normalization
        normalizedName = drug.toLowerCase().trim();
      }

      normalizedDrugs.push({ normalized: normalizedName, original: drug });
    }

    // Use the Single Source of Truth dataset service
    // We pass the *original* names (or simple normalized ones) to the service
    // The service handles its own internal logic
    const datasetInteractions = datasetService.checkInteractions(normalizedDrugs.map(d => d.original));

    interactions.push(...datasetInteractions);

    return interactions;
  }

  // Get comprehensive drug details from local DB
  async getDrugDetails(drugName: string): Promise<DrugDetail> {
    const lowerName = drugName.toLowerCase();

    // 1. Direct DB Lookup
    if (DRUG_DATABASE[lowerName]) {
      return DRUG_DATABASE[lowerName];
    }

    // 2. Try partial match/alias
    const foundKey = Object.keys(DRUG_DATABASE).find(k => k.includes(lowerName) || lowerName.includes(k));
    if (foundKey) {
      // Return DB data but with the requested name overrides if needed
      return { ...DRUG_DATABASE[foundKey], name: drugName };
    }

    // 3. Fallback for unknowns
    return {
      name: drugName,
      genericName: drugName,
      brandName: '',
      category: 'Uncategorized',
      indication: 'Detailed information not available in offline database.',
      mechanism: 'Unknown',
      sideEffects: [],
      contraindications: [],
      dosing: 'Consult clinical resources.',
      monitoring: 'Standard monitoring.'
    };
  }

  // Get severity icon
  getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'major': return '🔴';
      case 'moderate': return '🟡';
      case 'minor': return '🟢';
      default: return '⚪';
    }
  }

  // Get severity color class
  getSeverityColorClass(severity: string): string {
    switch (severity) {
      case 'major': return 'bg-red-50 border-red-500 text-red-900';
      case 'moderate': return 'bg-yellow-50 border-yellow-500 text-yellow-900';
      case 'minor': return 'bg-green-50 border-green-500 text-green-900';
      default: return 'bg-gray-50 border-gray-500 text-gray-900';
    }
  }
}

export const enhancedDrugInteractionService = new EnhancedDrugInteractionService();
export default enhancedDrugInteractionService;
