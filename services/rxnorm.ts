// RxNorm API Service
// Safe drug name normalization with maximum safety and fallback support

export interface NormalizedDrug {
  originalName: string;
  normalizedName: string;
  genericName?: string;
  brandName?: string;
  rxcui?: string;
  confidence: number;
  source: 'pattern' | 'api' | 'fallback';
}

export interface SafeNormalizationResult {
  normalized: NormalizedDrug;
  success: boolean;
  errors: string[];
}

class RxNormService {
  private baseUrl: string;
  private apiKey: string;
  private isApiAvailable: boolean;

  constructor() {
    this.baseUrl = 'https://clinicaltables.nlm.nih.gov/api/rxterms/v3';
    this.apiKey = import.meta.env.VITE_RXNORM_API_KEY || '';
    this.isApiAvailable = false;
    this.checkApiAvailability();
  }

  // Check if API is available (non-blocking)
  private async checkApiAvailability(): Promise<void> {
    try {
      // Quick test call to check API availability
      const testResponse = await fetch(`${this.baseUrl}/search?term=aspirin`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      this.isApiAvailable = testResponse.ok;
    } catch (error) {
      this.isApiAvailable = false;
      console.log('RxNorm API not available, using fallback normalization');
    }
  }

  // SAFE: Normalize drug name with maximum safety
  async normalizeDrugName(drugName: string): Promise<SafeNormalizationResult> {
    const result: SafeNormalizationResult = {
      normalized: {
        originalName: drugName,
        normalizedName: drugName,
        confidence: 0.5,
        source: 'fallback'
      },
      success: false,
      errors: []
    };

    try {
      // Validate input
      if (!drugName || typeof drugName !== 'string') {
        result.errors.push('Invalid drug name input');
        return result;
      }

      const trimmedName = drugName.trim();
      if (trimmedName.length === 0) {
        result.errors.push('Empty drug name');
        return result;
      }

      // Try API normalization if available
      if (this.isApiAvailable) {
        try {
          const apiResult = await this.normalizeWithAPI(trimmedName);
          if (apiResult.success) {
            return apiResult;
          }
        } catch (apiError) {
          result.errors.push(`API normalization failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
          // Continue with pattern normalization
        }
      }

      // Fallback to pattern-based normalization
      const patternResult = this.normalizeWithPatterns(trimmedName);
      if (patternResult.success) {
        return patternResult;
      }

      // Last resort: return original as normalized
      result.normalized = {
        originalName: drugName,
        normalizedName: this.basicNormalization(trimmedName),
        confidence: 0.3,
        source: 'fallback'
      };
      result.success = true;

    } catch (error) {
      result.errors.push(`Normalization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.normalized = {
        originalName: drugName,
        normalizedName: drugName,
        confidence: 0.1,
        source: 'fallback'
      };
    }

    return result;
  }

  // API-based normalization (if available)
  private async normalizeWithAPI(drugName: string): Promise<SafeNormalizationResult> {
    const result: SafeNormalizationResult = {
      normalized: {
        originalName: drugName,
        normalizedName: drugName,
        confidence: 0.8,
        source: 'api'
      },
      success: false,
      errors: []
    };

    try {
      const response = await fetch(`${this.baseUrl}/search?term=${encodeURIComponent(drugName)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        const data = await response.json();

        if (data && data.searchResults && data.searchResults.length > 0) {
          const bestMatch = data.searchResults[0];

          result.normalized = {
            originalName: drugName,
            normalizedName: bestMatch.name || drugName,
            genericName: bestMatch.name || drugName,
            brandName: bestMatch.synonym || drugName,
            rxcui: bestMatch.rxcui,
            confidence: 0.9,
            source: 'api'
          };
          result.success = true;
        } else {
          result.errors.push('No results found in API');
        }
      } else {
        result.errors.push(`API request failed: ${response.status}`);
      }
    } catch (error) {
      result.errors.push(`API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  // Pattern-based normalization (always available)
  private normalizeWithPatterns(drugName: string): SafeNormalizationResult {
    const result: SafeNormalizationResult = {
      normalized: {
        originalName: drugName,
        normalizedName: drugName,
        confidence: 0.7,
        source: 'pattern'
      },
      success: false,
      errors: []
    };

    try {
      const normalizedName = this.basicNormalization(drugName);

      // Brand name to generic name mapping
      const brandToGeneric = new Map([
        ['tylenol', 'acetaminophen'],
        ['advil', 'ibuprofen'],
        ['motrin', 'ibuprofen'],
        ['aleve', 'naproxen'],
        ['ecotrin', 'aspirin'],
        ['zestril', 'lisinopril'],
        ['prinivil', 'lisinopril'],
        ['lopressor', 'metoprolol'],
        ['toprol', 'metoprolol'],
        ['norvasc', 'amlodipine'],
        ['lipitor', 'atorvastatin'],
        ['zocor', 'simvastatin'],
        ['crestor', 'rosuvastatin'],
        ['amoxil', 'amoxicillin'],
        ['augmentin', 'amoxicillin'],
        ['zithromax', 'azithromycin'],
        ['cipro', 'ciprofloxacin'],
        ['coumadin', 'warfarin'],
        ['eliquis', 'apixaban'],
        ['xarelto', 'rivaroxaban'],
        ['prilosec', 'omeprazole'],
        ['nexium', 'esomeprazole'],
        ['protonix', 'pantoprazole'],
        ['zofran', 'ondansetron'],
        ['zoloft', 'sertraline'],
        ['prozac', 'fluoxetine'],
        ['lexapro', 'escitalopram'],
        ['glucophage', 'metformin'],
        ['humalog', 'insulin'],
        ['novolog', 'insulin'],
        ['lantus', 'insulin'],
        ['levemir', 'insulin'],
        ['vicodin', 'hydrocodone'],
        ['percocet', 'oxycodone'],
        ['oxycontin', 'oxycodone']
      ]);

      const lowerName = normalizedName.toLowerCase();
      const mappedName = brandToGeneric.get(lowerName);

      result.normalized = {
        originalName: drugName,
        normalizedName: mappedName || normalizedName,
        genericName: mappedName || normalizedName,
        brandName: mappedName ? drugName : undefined,
        confidence: mappedName ? 0.8 : 0.7,
        source: 'pattern'
      };
      result.success = true;

    } catch (error) {
      result.errors.push(`Pattern normalization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  // Basic normalization (always works)
  private basicNormalization(drugName: string): string {
    return drugName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  // SAFE: Batch normalize multiple drug names
  async normalizeDrugNames(drugNames: string[]): Promise<SafeNormalizationResult[]> {
    const results: SafeNormalizationResult[] = [];

    for (const drugName of drugNames) {
      const result = await this.normalizeDrugName(drugName);
      results.push(result);
    }

    return results;
  }

  // SAFE: Get drug suggestions (never fails)
  getDrugSuggestions(partialName: string): string[] {
    try {
      if (!partialName || typeof partialName !== 'string') return [];

      const normalizedName = partialName.toLowerCase().trim();
      if (normalizedName.length < 2) return [];

      // Common drug names for suggestions
      const commonDrugs = [
        'acetaminophen', 'ibuprofen', 'lisinopril', 'metformin', 'atorvastatin',
        'amoxicillin', 'warfarin', 'metoprolol', 'omeprazole', 'sertraline',
        'fluoxetine', 'escitalopram', 'insulin', 'hydrocodone', 'oxycodone',
        'prednisone', 'albuterol', 'fluticasone', 'ondansetron'
      ];

      return commonDrugs.filter(drug =>
        drug.includes(normalizedName) || normalizedName.includes(drug)
      ).slice(0, 10);
    } catch {
      return [];
    }
  }

  // SAFE: Validate drug name
  isValidDrugName(drugName: string): boolean {
    try {
      if (!drugName || typeof drugName !== 'string') return false;

      const normalizedName = this.basicNormalization(drugName);
      return normalizedName.length >= 2 && normalizedName.length <= 100;
    } catch {
      return false;
    }
  }

  // SAFE: Check API availability
  isAPIAvailable(): boolean {
    return this.isApiAvailable;
  }

  // SAFE: Get API status
  getAPIStatus(): any {
    return {
      available: this.isApiAvailable,
      apiKey: this.apiKey ? 'configured' : 'not configured',
      baseUrl: this.baseUrl
    };
  }
}

export const rxNormService = new RxNormService();
export default rxNormService;
