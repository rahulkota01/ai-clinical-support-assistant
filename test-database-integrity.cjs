const { DRUG_DATABASE, INTERACTION_DATABASE } = require('./services/drugDatabase.ts');

function validateDatabase() {
    console.log("=== Production Database Integrity Check ===");
    const errors = [];
    const suggestions = [];

    // 1. Check for Duplicate Drug Keys
    const drugKeys = Object.keys(DRUG_DATABASE);
    const uniqueKeys = new Set(drugKeys.map(k => k.toLowerCase()));
    if (drugKeys.length !== uniqueKeys.size) {
        errors.push(`Duplicate drug keys detected! Count: ${drugKeys.length}, Unique: ${uniqueKeys.size}`);
    }

    // 2. Validate Drug Objects
    drugKeys.forEach(key => {
        const drug = DRUG_DATABASE[key];
        if (!drug.name || !drug.category || !drug.indication || !drug.mechanism) {
            errors.push(`Missing critical fields for drug: ${key}`);
        }
        if (!Array.isArray(drug.sideEffects) || drug.sideEffects.length === 0) {
            suggestions.push(`Drug ${key} has no side effects listed.`);
        }
    });

    // 3. Check for Reciprocal Interactions
    const interactionSet = new Set();
    INTERACTION_DATABASE.forEach(inter => {
        interactionSet.add(`${inter.drug1}-${inter.drug2}`);
    });

    INTERACTION_DATABASE.forEach(inter => {
        const reciprocal = `${inter.drug2}-${inter.drug1}`;
        if (!interactionSet.has(reciprocal)) {
            errors.push(`Missing reciprocal interaction: ${reciprocal}`);
        }
    });

    // 4. Results
    console.log(`Total Drugs: ${drugKeys.length}`);
    console.log(`Total Interactions: ${INTERACTION_DATABASE.length}`);

    if (errors.length > 0) {
        console.error("CRITICAL ERRORS FOUND:");
        errors.forEach(err => console.error(`[ERR] ${err}`));
        process.exit(1);
    } else {
        console.log("Database Integrity: 100% PASSED");
        console.log("Duplicate Check: PASSED");
        console.log("Reciprocity Check: PASSED");
    }

    if (suggestions.length > 0) {
        console.log("\nSuggestions for improvement:");
        suggestions.forEach(sug => console.log(`[SUG] ${sug}`));
    }
}

try {
    validateDatabase();
} catch (e) {
    console.error("Validation script failed to run:", e.message);
    process.exit(1);
}
