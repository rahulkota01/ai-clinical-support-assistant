// OpenFDA API Service
// FDA drug safety and labeling information API

export interface OpenFDADrug {
  product_id: string;
  brand_name: string;
  generic_name: string;
  manufacturer_name: string;
  substance_name: string;
  product_type: string;
  route: string;
  marketing_status: string;
  application_number: string;
  dosage_form: string;
  strength: string;
  active_ingredients: Array<{
    name: string;
    strength: string;
  }>;
}

export interface OpenFDAAdverseEvent {
  safetyreportid: string;
  patient: {
    patientonsetage: string;
    patientsex: string;
    patientweight: string;
  };
  primarysource: {
    qualification: string;
    country: string;
  };
  suspectproduct: Array<{
    medicinalproduct: string;
    drugcharacterization: string;
  }>;
  reaction: Array<{
    reactionmeddrapt: string;
    reactionoutcome: string;
  }>;
}

export interface OpenFDARecall {
  recall_number: string;
  product_description: string;
  code_info: string;
  recalling_firm: string;
  recall_initiation_date: string;
  recall_status: string;
  product_type: string;
  reason_for_recall: string;
  classification: string;
}

export interface OpenFDALabel {
  id: string;
  effective_time: string;
  product_type: string;
  route: string;
  marketing_status: string;
  purpose: string;
  warnings: string[];
  dosage_and_administration: string;
  adverse_reactions: string[];
  drug_interactions: string[];
  contraindications: string[];
  precautions: string[];
}

class OpenFDAService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENFDA_API_KEY || '';
    this.baseUrl = 'https://api.fda.gov/drug';
  }

  // Search for drugs by name
  async searchDrugs(query: string): Promise<OpenFDADrug[]> {
    try {
      // Mocked data - replace with actual API call
      const mockDrugs: OpenFDADrug[] = [
        {
          product_id: '123456',
          brand_name: 'Tylenol',
          generic_name: 'Acetaminophen',
          manufacturer_name: 'Johnson & Johnson Consumer Inc',
          substance_name: 'ACETAMINOPHEN',
          product_type: 'HUMAN OTC DRUG',
          route: 'ORAL',
          marketing_status: 'Over the counter',
          application_number: 'NDA020473',
          dosage_form: 'TABLET',
          strength: '325MG',
          active_ingredients: [
            {
              name: 'ACETAMINOPHEN',
              strength: '325MG'
            }
          ]
        },
        {
          product_id: '789012',
          brand_name: 'Advil',
          generic_name: 'Ibuprofen',
          manufacturer_name: 'Pfizer Consumer Healthcare',
          substance_name: 'IBUPROFEN',
          product_type: 'HUMAN OTC DRUG',
          route: 'ORAL',
          marketing_status: 'Over the counter',
          application_number: 'NDA020473',
          dosage_form: 'TABLET',
          strength: '200MG',
          active_ingredients: [
            {
              name: 'IBUPROFEN',
              strength: '200MG'
            }
          ]
        }
      ].filter(drug =>
        drug.brand_name.toLowerCase().includes(query.toLowerCase()) ||
        drug.generic_name.toLowerCase().includes(query.toLowerCase())
      );

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 400));

      return mockDrugs;
    } catch (error) {
      console.error('Error searching drugs:', error);
      throw new Error('Failed to search drugs');
    }
  }

  // Get drug recalls
  async getRecalls(drugName?: string): Promise<OpenFDARecall[]> {
    try {
      // Mocked data - replace with actual API call
      const mockRecalls: OpenFDARecall[] = [
        {
          recall_number: 'D-1234-2024',
          product_description: 'Acetaminophen Tablets, 500mg',
          code_info: 'Product Code: 12345',
          recalling_firm: 'ABC Pharmaceuticals',
          recall_initiation_date: '20240115',
          recall_status: 'Ongoing',
          product_type: 'Drugs',
          reason_for_recall: 'Contamination with foreign substance',
          classification: 'Class II'
        },
        {
          recall_number: 'D-5678-2024',
          product_description: 'Ibuprofen Suspension, 100mg/5mL',
          code_info: 'Product Code: 67890',
          recalling_firm: 'XYZ Medical Supplies',
          recall_initiation_date: '20240220',
          recall_status: 'Completed',
          product_type: 'Drugs',
          reason_for_recall: 'Labeling error',
          classification: 'Class III'
        }
      ];

      // Filter by drug name if provided
      const filteredRecalls = drugName
        ? mockRecalls.filter(recall =>
          recall.product_description.toLowerCase().includes(drugName.toLowerCase())
        )
        : mockRecalls;

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      return filteredRecalls;
    } catch (error) {
      console.error('Error getting recalls:', error);
      throw new Error('Failed to get recalls');
    }
  }

  // Get drug labels
  async getDrugLabels(drugName: string): Promise<OpenFDALabel[]> {
    try {
      // Mocked data - replace with actual API call
      const mockLabels: OpenFDALabel[] = [
        {
          id: 'label_001',
          effective_time: '20240101',
          product_type: 'HUMAN OTC DRUG',
          route: 'ORAL',
          marketing_status: 'Over the counter',
          purpose: 'Temporarily relieves minor aches and pains',
          warnings: [
            'Liver warning: This product contains acetaminophen',
            'Do not use with any other drug containing acetaminophen',
            'Stop use and ask a doctor if pain gets worse or lasts more than 10 days'
          ],
          dosage_and_administration: 'Take 1-2 tablets every 4-6 hours as needed',
          adverse_reactions: [
            'Liver damage',
            'Allergic reactions',
            'Skin reactions'
          ],
          drug_interactions: [
            'Alcohol',
            'Warfarin',
            'Other acetaminophen-containing products'
          ],
          contraindications: [
            'Severe liver impairment',
            'Hypersensitivity to acetaminophen'
          ],
          precautions: [
            'Do not exceed recommended dose',
            'Consult doctor if pregnant or breastfeeding',
            'Keep out of reach of children'
          ]
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));

      return mockLabels;
    } catch (error) {
      console.error('Error getting drug labels:', error);
      throw new Error('Failed to get drug labels');
    }
  }

  // Get drug enforcement reports
  async getEnforcementReports(drugName?: string): Promise<any[]> {
    try {
      // Mocked data - replace with actual API call
      const mockReports = [
        {
          recall_number: 'ENF-1234-2024',
          product_description: 'Counterfeit medication',
          recalling_firm: 'FDA',
          recall_initiation_date: '20240301',
          recall_status: 'Completed',
          classification: 'Class I',
          reason_for_recall: 'Counterfeit product'
        }
      ];

      // Filter by drug name if provided
      const filteredReports = drugName
        ? mockReports.filter(report =>
          report.product_description.toLowerCase().includes(drugName.toLowerCase())
        )
        : mockReports;

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 400));

      return filteredReports;
    } catch (error) {
      console.error('Error getting enforcement reports:', error);
      throw new Error('Failed to get enforcement reports');
    }
  }

  // Get NDC (National Drug Code) information
  async getNDCInfo(ndcCode: string): Promise<OpenFDADrug> {
    try {
      // Mocked data - replace with actual API call
      const mockNDC: OpenFDADrug = {
        product_id: ndcCode,
        brand_name: 'Tylenol',
        generic_name: 'Acetaminophen',
        manufacturer_name: 'Johnson & Johnson Consumer Inc',
        substance_name: 'ACETAMINOPHEN',
        product_type: 'HUMAN OTC DRUG',
        route: 'ORAL',
        marketing_status: 'Over the counter',
        application_number: 'NDA020473',
        dosage_form: 'TABLET',
        strength: '325MG',
        active_ingredients: [
          {
            name: 'ACETAMINOPHEN',
            strength: '325MG'
          }
        ]
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 250));

      return mockNDC;
    } catch (error) {
      console.error('Error getting NDC info:', error);
      throw new Error('Failed to get NDC information');
    }
  }

  // Get drug safety communications
  async getSafetyCommunications(drugName?: string): Promise<any[]> {
    try {
      // Mocked data - replace with actual API call
      const mockCommunications = [
        {
          title: 'FDA Drug Safety Communication',
          text: 'Important safety information about acetaminophen',
          date: '20240115',
          drug: 'Acetaminophen'
        }
      ];

      // Filter by drug name if provided
      const filteredCommunications = drugName
        ? mockCommunications.filter(comm =>
          comm.drug.toLowerCase().includes(drugName.toLowerCase())
        )
        : mockCommunications;

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));

      return filteredCommunications;
    } catch (error) {
      console.error('Error getting safety communications:', error);
      throw new Error('Failed to get safety communications');
    }
  }

  // Get drug interactions (missing method)
  async getDrugInteractions(drugName1: string, drugName2?: string): Promise<{
    interactions: Array<{
      drug1: string;
      drug2: string;
      severity: 'major' | 'moderate' | 'minor' | 'unknown';
      description: string;
      mechanism?: string;
      recommendation?: string;
      source: 'fda' | 'fallback';
      confidence: number;
    }>;
    totalFound: number;
    success: boolean;
    errors: string[];
  }> {
    const result = {
      interactions: [],
      totalFound: 0,
      success: false,
      errors: []
    };

    try {
      // Mocked interaction data
      const mockInteractions = [
        {
          drug1: drugName1,
          drug2: drugName2 || 'warfarin',
          severity: 'moderate',
          description: 'May increase risk of bleeding when used together',
          mechanism: 'NSAIDs can enhance the anticoagulant effect of warfarin',
          recommendation: 'Monitor INR closely or avoid combination',
          source: 'fallback',
          confidence: 0.8
        }
      ];

      result.interactions = mockInteractions;
      result.totalFound = mockInteractions.length;
      result.success = true;

    } catch (error) {
      result.errors.push(`Error getting interactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.success = false;
    }

    return result;
  }

  // Get adverse events (missing method)
  async getAdverseEvents(drugName: string, limit: number = 50): Promise<{
    events: Array<{
      safetyreportid: string;
      patient: {
        patientonsetage: string;
        patientsex: string;
        patientweight: string;
      };
      primarysource: {
        qualification: string;
        country: string;
      };
      suspectproduct: Array<{
        medicinalproduct: string;
        drugcharacterization: string;
      }>;
      reaction: Array<{
        reactionmeddrapt: string;
        reactionoutcome: string;
      }>;
    }>;
    success: boolean;
    errors: string[];
  }> {
    const result = {
      events: [],
      success: false,
      errors: []
    };

    try {
      // Mocked adverse events
      const mockEvents = [
        {
          safetyreportid: '10000001',
          patient: {
            patientonsetage: '45',
            patientsex: '1',
            patientweight: '70'
          },
          primarysource: {
            qualification: 'Physician',
            country: 'US'
          },
          suspectproduct: [
            {
              medicinalproduct: drugName,
              drugcharacterization: 'Prescribed'
            }
          ],
          reaction: [
            {
              reactionmeddrapt: 'Headache',
              reactionoutcome: 'Recovered'
            },
            {
              reactionmeddrapt: 'Nausea',
              reactionoutcome: 'Recovered'
            }
          ]
        }
      ];

      result.events = mockEvents.slice(0, limit);
      result.success = true;

    } catch (error) {
      result.errors.push(`Error getting adverse events: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.success = false;
    }

    return result;
  }
}

export const openFDAService = new OpenFDAService();
export default openFDAService;
