import { DrugInteraction } from './drugDatabase';

// Type definitions for our dataset
interface InteractionRow {
    drug1: string;
    drug2: string;
    severity: 'major' | 'moderate' | 'minor' | 'unknown';
    description: string;
    mechanism?: string;
}

class DatasetService {
    private drugNames: Set<string> = new Set();
    private interactionMap: Map<string, InteractionRow[]> = new Map();
    private isLoaded: boolean = false;
    private loadPromise: Promise<void> | null = null;

    /**
     * Initialize the dataset service by loading files from public/data
     */
    public async init(): Promise<void> {
        if (this.isLoaded) return;
        if (this.loadPromise) return this.loadPromise;

        this.loadPromise = this.loadData();
        return this.loadPromise;
    }

    private async loadData(): Promise<void> {
        try {
            console.log('DatasetService: Starting to load datasets...');

            // Load Drug Names
            const namesResponse = await fetch('/data/DrugNames.txt');
            if (!namesResponse.ok) throw new Error('Failed to load DrugNames.txt');
            const namesText = await namesResponse.text();

            this.drugNames = new Set(
                namesText.split('\n')
                    .map(n => n.trim().toLowerCase())
                    .filter(n => n.length > 0)
            );
            console.log(`DatasetService: Loaded ${this.drugNames.size} drug names.`);

            // Load Interactions CSV
            const csvResponse = await fetch('/data/db_drug_interactions.csv');
            if (!csvResponse.ok) throw new Error('Failed to load db_drug_interactions.csv');
            const csvText = await csvResponse.text();

            this.parseInteractionsCSV(csvText);
            console.log(`DatasetService: Interaction database loaded.`);

            this.isLoaded = true;
        } catch (error) {
            console.error('DatasetService: Error loading datasets:', error);
            // We don't throw here to avoid crashing the app, but functionality will be limited
        }
    }

    private parseInteractionsCSV(csvText: string) {
        const lines = csvText.split('\n');
        let headers: string[] = [];

        // Simple CSV parser that handles quotes
        const parseLine = (text: string) => {
            const result = [];
            let cur = '';
            let inQuote = false;
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                if (char === '"') {
                    inQuote = !inQuote;
                } else if (char === ',' && !inQuote) {
                    result.push(cur.trim());
                    cur = '';
                } else {
                    cur += char;
                }
            }
            result.push(cur.trim());
            return result;
        };

        // Assume first line is header if it looks like it
        if (lines.length > 0) {
            const firstLine = lines[0].toLowerCase();
            if (firstLine.includes('drug') && firstLine.includes('interaction')) {
                headers = parseLine(lines[0].toLowerCase());
                lines.shift();
            }
        }

        // Default indices if header not found
        let idxD1 = 0, idxD2 = 1, idxDesc = 2, idxSev = 3;

        if (headers.length > 0) {
            idxD1 = headers.findIndex(h => h.includes('drug 1') || h === 'drug1');
            idxD2 = headers.findIndex(h => h.includes('drug 2') || h === 'drug2');
            idxDesc = headers.findIndex(h => h.includes('description') || h.includes('interaction'));
            idxSev = headers.findIndex(h => h.includes('severity'));

            // Fallback if not found
            if (idxD1 === -1) idxD1 = 0;
            if (idxD2 === -1) idxD2 = 1;
            if (idxDesc === -1) idxDesc = 2;
        }

        lines.forEach(line => {
            if (!line.trim()) return;
            const cols = parseLine(line);
            if (cols.length < 2) return;

            const d1 = cols[idxD1]?.toLowerCase();
            const d2 = cols[idxD2]?.toLowerCase();

            if (!d1 || !d2) return;

            const severityRaw = cols[idxSev]?.toLowerCase() || 'unknown';
            let severity: 'major' | 'moderate' | 'minor' | 'unknown' = 'unknown';
            if (severityRaw.includes('major') || severityRaw.includes('high')) severity = 'major';
            else if (severityRaw.includes('moderate') || severityRaw.includes('medium')) severity = 'moderate';
            else if (severityRaw.includes('minor') || severityRaw.includes('low')) severity = 'minor';

            const interaction: InteractionRow = {
                drug1: d1,
                drug2: d2,
                severity,
                description: cols[idxDesc] || 'Interaction detected.'
            };

            // Store symmetrically for O(1) lookup
            this.addInteraction(d1, interaction);
            this.addInteraction(d2, interaction);
        });
    }

    private addInteraction(key: string, interaction: InteractionRow) {
        if (!this.interactionMap.has(key)) {
            this.interactionMap.set(key, []);
        }
        this.interactionMap.get(key)!.push(interaction);
    }

    /**
     * Check if a drug name exists in our allowed list
     */
    public isValidDrug(drugName: string): boolean {
        if (!this.isLoaded) return true; // Fail open if not loaded, or use static DB
        return this.drugNames.has(drugName.toLowerCase());
    }

    /**
     * Get all interactions for a specific pair
     */
    public getInteraction(drugA: string, drugB: string): InteractionRow | null {
        const da = drugA.toLowerCase();
        const db = drugB.toLowerCase();

        const candidates = this.interactionMap.get(da);
        if (!candidates) return null;

        return candidates.find(i => i.drug1 === db || i.drug2 === db) || null;
    }

    /**
     * Check list of drugs for ANY interactions
     */
    public checkInteractions(drugList: string[]): DrugInteraction[] {
        const results: DrugInteraction[] = [];
        const n = drugList.length;

        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                const d1 = drugList[i];
                const d2 = drugList[j];

                const interaction = this.getInteraction(d1, d2);
                if (interaction) {
                    results.push({
                        drug1: d1, // Keep original casing if possible, but we stored lower
                        drug2: d2,
                        severity: interaction.severity,
                        description: interaction.description,
                        source: 'database',
                        confidence: 1.0
                    });
                }
            }
        }
        return results;
    }

    public getStatus() {
        return {
            loaded: this.isLoaded,
            drugCount: this.drugNames.size,
            interactionCount: this.interactionMap.size // Key count, not total edges
        };
    }

    /**
     * Get list of drug names matching a search term
     */
    public getDrugSuggestions(term: string, limit: number = 10): string[] {
        if (!this.isLoaded || !term || term.length < 2) return [];

        const lowerTerm = term.toLowerCase();
        const matches: string[] = [];

        // Convert Set to Array for iteration - optimization: cache array if needed
        // but for <10k items, simple iteration is fast enough
        const allDrugs = Array.from(this.drugNames);

        // 1. Starts with matches (High priority)
        for (const drug of allDrugs) {
            if (drug.startsWith(lowerTerm)) {
                matches.push(drug);
                if (matches.length >= limit) return matches;
            }
        }

        // 2. Contains matches (if we haven't filled the limit)
        if (matches.length < limit) {
            for (const drug of allDrugs) {
                // Avoid duplicates
                if (!drug.startsWith(lowerTerm) && drug.includes(lowerTerm)) {
                    matches.push(drug);
                    if (matches.length >= limit) return matches;
                }
            }
        }

        return matches;
    }
}

export const datasetService = new DatasetService();
