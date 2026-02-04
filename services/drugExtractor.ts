// Drug Extractor Service
// Safe drug name extraction from AI-generated text with maximum safety

export interface ExtractedDrug {
  name: string;
  confidence: number;
  position: {
    start: number;
    end: number;
  };
}

export interface SafeExtractionResult {
  drugs: ExtractedDrug[];
  totalFound: number;
  success: boolean;
  errors: string[];
}

class DrugExtractorService {
  // Safe drug name patterns - comprehensive but non-breaking
  private safeDrugPatterns: Array<{
    name: string;
    pattern: RegExp;
    confidence: number;
  }>;

  constructor() {
    this.safeDrugPatterns = [
      // Common pain medications
      { name: 'acetaminophen', pattern: /\b(acetaminophen|paracetamol|tylenol)\b/gi, confidence: 0.95 },
      { name: 'ibuprofen', pattern: /\b(ibuprofen|advil|motrin)\b/gi, confidence: 0.95 },
      { name: 'naproxen', pattern: /\b(naproxen|aleve)\b/gi, confidence: 0.90 },
      { name: 'aspirin', pattern: /\b(aspirin|ecotrin)\b/gi, confidence: 0.95 },
      
      // Cardiovascular medications
      { name: 'lisinopril', pattern: /\b(lisinopril|zestril|prinivil)\b/gi, confidence: 0.90 },
      { name: 'metoprolol', pattern: /\b(metoprolol|lopressor|toprol)\b/gi, confidence: 0.90 },
      { name: 'atenolol', pattern: /\b(atenolol|tenormin)\b/gi, confidence: 0.90 },
      { name: 'amlodipine', pattern: /\b(amlodipine|norvasc)\b/gi, confidence: 0.90 },
      { name: 'hydrochlorothiazide', pattern: /\b(hydrochlorothiazide|hctz)\b/gi, confidence: 0.85 },
      
      // Diabetes medications
      { name: 'metformin', pattern: /\b(metformin|glucophage|fortamet)\b/gi, confidence: 0.95 },
      { name: 'insulin', pattern: /\b(insulin|humalog|novolog|lantus|levemir)\b/gi, confidence: 0.95 },
      { name: 'glipizide', pattern: /\b(glipizide|glucotrol)\b/gi, confidence: 0.85 },
      { name: 'glyburide', pattern: /\b(glyburide|diabeta|micronase)\b/gi, confidence: 0.85 },
      
      // Statins
      { name: 'atorvastatin', pattern: /\b(atorvastatin|lipitor)\b/gi, confidence: 0.95 },
      { name: 'simvastatin', pattern: /\b(simvastatin|zocor)\b/gi, confidence: 0.95 },
      { name: 'rosuvastatin', pattern: /\b(rosuvastatin|crestor)\b/gi, confidence: 0.95 },
      
      // Antibiotics
      { name: 'amoxicillin', pattern: /\b(amoxicillin|amoxil|augmentin)\b/gi, confidence: 0.95 },
      { name: 'azithromycin', pattern: /\b(azithromycin|zithromax)\b/gi, confidence: 0.95 },
      { name: 'ciprofloxacin', pattern: /\b(ciprofloxacin|cipro)\b/gi, confidence: 0.95 },
      { name: 'doxycycline', pattern: /\b(doxycycline|vibramycin)\b/gi, confidence: 0.90 },
      
      // Anticoagulants
      { name: 'warfarin', pattern: /\b(warfarin|coumadin)\b/gi, confidence: 0.95 },
      { name: 'apixaban', pattern: /\b(apixaban|eliquis)\b/gi, confidence: 0.90 },
      { name: 'rivaroxaban', pattern: /\b(rivaroxaban|xarelto)\b/gi, confidence: 0.90 },
      
      // Respiratory medications
      { name: 'albuterol', pattern: /\b(albuterol|ventolin|proair)\b/gi, confidence: 0.95 },
      { name: 'fluticasone', pattern: /\b(fluticasone|flovent|advair)\b/gi, confidence: 0.90 },
      { name: 'montelukast', pattern: /\b(montelukast|singulair)\b/gi, confidence: 0.90 },
      
      // GI medications
      { name: 'omeprazole', pattern: /\b(omeprazole|prilosec)\b/gi, confidence: 0.95 },
      { name: 'pantoprazole', pattern: /\b(pantoprazole|protonix)\b/gi, confidence: 0.90 },
      { name: 'ondansetron', pattern: /\b(ondansetron|zofran)\b/gi, confidence: 0.95 },
      
      // Psychiatric medications
      { name: 'sertraline', pattern: /\b(sertraline|zoloft)\b/gi, confidence: 0.90 },
      { name: 'fluoxetine', pattern: /\b(fluoxetine|prozac)\b/gi, confidence: 0.90 },
      { name: 'escitalopram', pattern: /\b(escitalopram|lexapro)\b/gi, confidence: 0.90 },
      
      // Others
      { name: 'prednisone', pattern: /\b(prednisone|deltasone)\b/gi, confidence: 0.95 },
      { name: 'hydrocodone', pattern: /\b(hydrocodone|vicodin|norco)\b/gi, confidence: 0.95 },
      { name: 'oxycodone', pattern: /\b(oxycodone|percocet|oxycontin)\b/gi, confidence: 0.95 }
    ];
  }

  // SAFE: Extract drug names from AI-generated text
  async extractDrugNames(text: string): Promise<SafeExtractionResult> {
    const result: SafeExtractionResult = {
      drugs: [],
      totalFound: 0,
      success: false,
      errors: []
    };

    try {
      // Validate input
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        result.errors.push('Invalid or empty text input');
        return result;
      }

      const extractedDrugs: ExtractedDrug[] = [];
      const seenPositions = new Set<string>();

      // Process each safe pattern
      for (const drugPattern of this.safeDrugPatterns) {
        try {
          const matches = [...text.matchAll(drugPattern.pattern)];
          
          for (const match of matches) {
            if (match && match.index !== undefined) {
              const positionKey = `${match.index}-${match.index + match[0].length}`;
              
              // Avoid duplicates in same position
              if (!seenPositions.has(positionKey)) {
                seenPositions.add(positionKey);
                
                const drug: ExtractedDrug = {
                  name: drugPattern.name,
                  confidence: drugPattern.confidence,
                  position: {
                    start: match.index,
                    end: match.index + match[0].length
                  }
                };
                
                extractedDrugs.push(drug);
              }
            }
          }
        } catch (patternError) {
          result.errors.push(`Error processing pattern for ${drugPattern.name}: ${patternError instanceof Error ? patternError.message : 'Unknown error'}`);
          // Continue with other patterns
        }
      }

      // Sort by confidence and position
      extractedDrugs.sort((a, b) => {
        if (b.confidence !== a.confidence) {
          return b.confidence - a.confidence;
        }
        return a.position.start - b.position.start;
      });

      result.drugs = extractedDrugs;
      result.totalFound = extractedDrugs.length;
      result.success = true;

    } catch (error) {
      result.errors.push(`Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Never throw - always return safe result
    }

    return result;
  }

  // SAFE: Quick drug name validation
  isValidDrugName(name: string): boolean {
    try {
      if (!name || typeof name !== 'string') return false;
      
      const normalizedName = name.toLowerCase().trim();
      return normalizedName.length >= 2 && normalizedName.length <= 100 &&
             this.safeDrugPatterns.some(pattern => 
               pattern.name === normalizedName || 
               pattern.pattern.test(name)
             );
    } catch {
      return false;
    }
  }

  // SAFE: Get drug suggestions (never fails)
  getDrugSuggestions(partialName: string): string[] {
    try {
      if (!partialName || typeof partialName !== 'string') return [];
      
      const normalizedName = partialName.toLowerCase().trim();
      if (normalizedName.length < 2) return [];

      return this.safeDrugPatterns
        .filter(pattern => pattern.name.includes(normalizedName))
        .map(pattern => pattern.name)
        .slice(0, 10);
    } catch {
      return [];
    }
  }

  // SAFE: Extract drugs with maximum safety
  async extractDrugsSafely(text: string): Promise<ExtractedDrug[]> {
    try {
      const result = await this.extractDrugNames(text);
      return result.success ? result.drugs : [];
    } catch {
      // Never throw - always return empty array
      return [];
    }
  }
}

export const drugExtractorService = new DrugExtractorService();
export default drugExtractorService;
