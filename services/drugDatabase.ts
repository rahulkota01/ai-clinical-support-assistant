export interface DrugInteraction {
    drug1: string;
    drug2: string;
    severity: 'major' | 'moderate' | 'minor' | 'unknown';
    description: string;
    mechanism?: string;
    recommendation?: string;
    source: 'database' | 'ai' | 'fda' | 'fallback';
    confidence: number;
}

export interface DrugDetail {
    name: string;
    genericName?: string;
    brandName?: string;
    category: string;
    indication: string;
    mechanism: string;
    sideEffects: string[];
    contraindications: string[];
    dosing: string;
    monitoring: string;
}

// Helper to create symmetric interaction
const createInteraction = (d1: string, d2: string, severity: 'major' | 'moderate' | 'minor', desc: string, mech: string, rec: string): DrugInteraction[] => {
    return [
        {
            drug1: d1,
            drug2: d2,
            severity,
            description: desc,
            mechanism: mech,
            recommendation: rec,
            source: 'database',
            confidence: 0.99
        },
        {
            drug1: d2,
            drug2: d1,
            severity,
            description: desc,
            mechanism: mech,
            recommendation: rec,
            source: 'database',
            confidence: 0.99
        }
    ];
};

export const DRUG_DATABASE: Record<string, DrugDetail> = {
    // ANALGESICS / NSAIDS
    'acetaminophen': {
        name: 'Acetaminophen',
        genericName: 'Acetaminophen',
        brandName: 'Tylenol',
        category: 'Analgesic/Antipyretic',
        indication: 'Pain relief, Fever',
        mechanism: 'Inhibits prostaglandin synthesis in the CNS.',
        sideEffects: ['Hepatotoxicity (overdose)', 'Rash', 'Hypersensitivity'],
        contraindications: ['Severe hepatic impairment', 'Hypersensitivity'],
        dosing: '325-1000 mg q4-6h (Max 4g/day)',
        monitoring: 'Liver function (ALT/AST) in chronic use'
    },
    'ibuprofen': {
        name: 'Ibuprofen',
        genericName: 'Ibuprofen',
        brandName: 'Advil, Motrin',
        category: 'NSAID',
        indication: 'Pain, Inflammation, Fever',
        mechanism: 'Non-selective COX-1 and COX-2 inhibitor.',
        sideEffects: ['GI bleeding', 'Renal impairment', 'Dyspepsia', 'Hypertension'],
        contraindications: ['Active GI bleeding', 'CABG surgery', 'Aspirin allergy'],
        dosing: '200-800 mg q6-8h (Max 3.2g/day)',
        monitoring: 'Renal function, BP, Signs of bleeding'
    },
    'aspirin': {
        name: 'Aspirin',
        genericName: 'Aspirin',
        brandName: 'Bayer',
        category: 'Antiplatelet/NSAID',
        indication: 'ACS, Ischemic stroke prevention, Analgesia',
        mechanism: 'Irreversible COX-1 inhibitor; inhibits thromboxane A2.',
        sideEffects: ['GI bleeding', 'Tinnitus', 'Bronchospasm', 'Reye syndrome'],
        contraindications: ['Active bleeding', 'Children (viral)', 'Bleeding disorders'],
        dosing: '81mg daily (cardio); 325-650mg q4h (pain)',
        monitoring: 'Signs of bleeding'
    },
    'naproxen': {
        name: 'Naproxen',
        genericName: 'Naproxen',
        brandName: 'Aleve',
        category: 'NSAID',
        indication: 'Arthritis, Pain, Dysmenorrhea',
        mechanism: 'Non-selective COX inhibitor.',
        sideEffects: ['GI upset', 'Edema', 'Renal toxicity'],
        contraindications: ['Active peptic ulcer', 'CKD'],
        dosing: '250-500 mg BID',
        monitoring: 'Renal function, BP'
    },
    'tramadol': {
        name: 'Tramadol',
        genericName: 'Tramadol',
        brandName: 'Ultram',
        category: 'Opioid Analgesic',
        indication: 'Moderate to severe pain',
        mechanism: 'Mu-opioid agonist and weak inhibition of NE/5-HT reuptake.',
        sideEffects: ['Dizziness', 'Constipation', 'Seizures', 'Serotonin syndrome'],
        contraindications: ['Severe respiratory depression', 'MAOI use'],
        dosing: '50-100 mg q4-6h',
        monitoring: 'Respiratory status, Seizure risk'
    },

    // CARDIOLOGY - ACE/ARBs
    'lisinopril': {
        name: 'Lisinopril',
        genericName: 'Lisinopril',
        brandName: 'Prinivil, Zestril',
        category: 'ACE Inhibitor',
        indication: 'Hypertension, Heart Failure, AMI',
        mechanism: 'Inhibits conversion of Angiotensin I to II.',
        sideEffects: ['Dry cough', 'Hyperkalemia', 'Angioedema', 'Hypotension'],
        contraindications: ['History of angioedema', 'Pregnancy', 'Bilateral RAS'],
        dosing: '10-40 mg daily',
        monitoring: 'BP, K+, Creatinine'
    },
    'losartan': {
        name: 'Losartan',
        genericName: 'Losartan',
        brandName: 'Cozaar',
        category: 'ARB',
        indication: 'Hypertension, Diabetic Nephropathy',
        mechanism: 'Blocks Angiotensin II receptors.',
        sideEffects: ['Dizziness', 'Hyperkalemia', 'Hypotension'],
        contraindications: ['Pregnancy'],
        dosing: '50-100 mg daily',
        monitoring: 'BP, K+, Renal function'
    },

    // CARDIOLOGY - BETA BLOCKERS
    'metoprolol': {
        name: 'Metoprolol',
        genericName: 'Metoprolol',
        brandName: 'Lopressor',
        category: 'Beta-Blocker (Cardioselective)',
        indication: 'Hypertension, Angina, Heart Failure',
        mechanism: 'Blocks beta-1 adrenergic receptors.',
        sideEffects: ['Bradycardia', 'Fatigue', 'Hypotension', 'Bronchospasm (high dose)'],
        contraindications: ['Decompensated HF', 'Sinus bradycardia <45', '2nd/3rd degree block'],
        dosing: '25-100 mg BID (Tartrate) or daily (Succinate)',
        monitoring: 'HR, BP'
    },
    'atenolol': {
        name: 'Atenolol',
        genericName: 'Atenolol',
        brandName: 'Tenormin',
        category: 'Beta-Blocker',
        indication: 'Hypertension, Angina',
        mechanism: 'Cardioselective beta-1 blocker.',
        sideEffects: ['Cold extremities', 'Bradycardia', 'Fatigue'],
        contraindications: ['Sinus bradycardia', 'Heart block'],
        dosing: '25-100 mg daily',
        monitoring: 'HR, BP'
    },

    // CARDIOLOGY - CCBs / DIURETICS
    'amlodipine': {
        name: 'Amlodipine',
        genericName: 'Amlodipine',
        brandName: 'Norvasc',
        category: 'Calcium Channel Blocker',
        indication: 'Hypertension, Angina',
        mechanism: 'Inhibits calcium ion influx in vascular smooth muscle.',
        sideEffects: ['Peripheral edema', 'Flushing', 'Palpitations'],
        contraindications: ['Severe hypotension', 'Shock'],
        dosing: '2.5-10 mg daily',
        monitoring: 'BP, Edema'
    },
    'hydrochlorothiazide': {
        name: 'Hydrochlorothiazide',
        genericName: 'Hydrochlorothiazide',
        brandName: 'Microzide',
        category: 'Thiazide Diuretic',
        indication: 'Hypertension, Edema',
        mechanism: 'Inhibits Na/Cl reabsorption in distal tubule.',
        sideEffects: ['Hypokalemia', 'Hyponatremia', 'Hyperuricemia', 'Photosensitivity'],
        contraindications: ['Anuria', 'Sulfa allergy'],
        dosing: '12.5-50 mg daily',
        monitoring: 'Electrolytes, BP, Uric acid'
    },
    'furosemide': {
        name: 'Furosemide',
        genericName: 'Furosemide',
        brandName: 'Lasix',
        category: 'Loop Diuretic',
        indication: 'Edema, Heart Failure',
        mechanism: 'Inhibits Na/K/2Cl cotransporter in loop of Henle.',
        sideEffects: ['Hypokalemia', 'Dehydration', 'Ototoxicity (high dose)'],
        contraindications: ['Anuria'],
        dosing: '20-80 mg daily/BID',
        monitoring: 'Electrolytes, Fluid status, Renal function'
    },

    // ANTICOAGULANTS
    'warfarin': {
        name: 'Warfarin',
        genericName: 'Warfarin',
        brandName: 'Coumadin',
        category: 'Anticoagulant',
        indication: 'AFib, DVT/PE treatment',
        mechanism: 'Vitamin K antagonist.',
        sideEffects: ['Bleeding', 'Purple toe syndrome', 'Skin necrosis'],
        contraindications: ['Pregnancy', 'Active bleeding', 'Hemorrhagic tendencies'],
        dosing: 'Titrated to INR (Target 2-3 usually)',
        monitoring: 'INR (frequent), Signs of bleeding'
    },
    'apixaban': {
        name: 'Apixaban',
        genericName: 'Apixaban',
        brandName: 'Eliquis',
        category: 'DOAC',
        indication: 'Stroke prevention in AFib, DVT/PE',
        mechanism: 'Factor Xa inhibitor.',
        sideEffects: ['Bleeding', 'Anemia'],
        contraindications: ['Active pathological bleeding'],
        dosing: '5 mg BID (adjusted for age/wt/creat)',
        monitoring: 'Renal function, CBC'
    },

    // ANTIBIOTICS
    'amoxicillin': {
        name: 'Amoxicillin',
        genericName: 'Amoxicillin',
        brandName: 'Amoxil',
        category: 'Penicillin Antibiotic',
        indication: 'URTI, Otitis media, Skin infections',
        mechanism: 'Inhibits bacterial cell wall synthesis.',
        sideEffects: ['Diarrhea', 'Rash', 'Nausea'],
        contraindications: ['Penicillin allergy'],
        dosing: '500-875 mg q12h or 250-500 mg q8h',
        monitoring: 'Signs of anaphylaxis'
    },
    'azithromycin': {
        name: 'Azithromycin',
        genericName: 'Azithromycin',
        brandName: 'Zithromax',
        category: 'Macrolide Antibiotic',
        indication: 'Pneumonia, Chlamydia, Pharyngitis',
        mechanism: 'Inhibits protein synthesis (50S subunit).',
        sideEffects: ['QT prolongation', 'Diarrhea', 'Abdominal pain'],
        contraindications: ['Cholestatic jaundice history', 'QT prolongation'],
        dosing: '500mg day 1, then 250mg days 2-5',
        monitoring: 'ECG (if risk factors)'
    },
    'ciprofloxacin': {
        name: 'Ciprofloxacin',
        genericName: 'Ciprofloxacin',
        brandName: 'Cipro',
        category: 'Fluoroquinolone',
        indication: 'UTI, Pneumonia, Skin infections',
        mechanism: 'Inhibits DNA gyrase/topoisomerase.',
        sideEffects: ['Tendon rupture', 'QT prolongation', 'CNS toxicity'],
        contraindications: ['Myasthenia gravis', 'Tizanidine use'],
        dosing: '250-750 mg q12h',
        monitoring: 'Tendon pain, Mental status'
    },

    // DIABETES
    'metformin': {
        name: 'Metformin',
        genericName: 'Metformin',
        brandName: 'Glucophage',
        category: 'Biguanide',
        indication: 'Type 2 Diabetes',
        mechanism: 'Decreases hepatic glucose output, improves insulin sensitivity.',
        sideEffects: ['Diarrhea', 'Nausea', 'Lactic acidosis (rare)', 'B12 deficiency'],
        contraindications: ['eGFR < 30', 'Metabolic acidosis'],
        dosing: '500-2000 mg daily',
        monitoring: 'A1C, Renal function, B12'
    },
    'glipizide': {
        name: 'Glipizide',
        genericName: 'Glipizide',
        brandName: 'Glucotrol',
        category: 'Sulfonylurea',
        indication: 'Type 2 Diabetes',
        mechanism: 'Stimulates insulin release from pancreas.',
        sideEffects: ['Hypoglycemia', 'Weight gain'],
        contraindications: ['DKA', 'T1DM'],
        dosing: '2.5-20 mg daily',
        monitoring: 'Glucose, A1C'
    },

    // PSYCH / NEURO
    'sertraline': {
        name: 'Sertraline',
        genericName: 'Sertraline',
        brandName: 'Zoloft',
        category: 'SSRI',
        indication: 'MDD, Anxiety, PTSD',
        mechanism: 'Inhibits serotonin reuptake.',
        sideEffects: ['Nausea', 'Insomnia', 'Sexual dysfunction'],
        contraindications: ['MAOI use'],
        dosing: '50-200 mg daily',
        monitoring: 'Suicidality, Sodium'
    },
    'alprazolam': {
        name: 'Alprazolam',
        genericName: 'Alprazolam',
        brandName: 'Xanax',
        category: 'Benzodiazepine',
        indication: 'Anxiety, Panic disorder',
        mechanism: 'Enhances GABA activity.',
        sideEffects: ['Sedation', 'Respiratory depression', 'Dependence'],
        contraindications: ['Acute narrow-angle glaucoma', 'Ketoconazole use'],
        dosing: '0.25-0.5 mg TID',
        monitoring: 'Respiratory rate, Sedation'
    },

    // OTHERS
    'atorvastatin': {
        name: 'Atorvastatin',
        genericName: 'Atorvastatin',
        brandName: 'Lipitor',
        category: 'Statin',
        indication: 'Hyperlipidemia',
        mechanism: 'HMG-CoA reductase inhibitor.',
        sideEffects: ['Myopathy', 'Liver enzyme elevation', 'Diabetes risk'],
        contraindications: ['Active liver disease', 'Pregnancy'],
        dosing: '10-80 mg daily',
        monitoring: 'Lipids, LFTs, CK (if muscle pain)'
    },
    'omeprazole': {
        name: 'Omeprazole',
        genericName: 'Omeprazole',
        brandName: 'Prilosec',
        category: 'PPI',
        indication: 'GERD, Peptic Ulcer',
        mechanism: 'Inhibits H+/K+ ATPase pump.',
        sideEffects: ['Headache', 'Abdominal pain', 'C. diff risk', 'B12 deficiency'],
        contraindications: ['Hypersensitivity'],
        dosing: '20-40 mg daily',
        monitoring: 'Mg levels (long term)'
    },
    'albuterol': {
        name: 'Albuterol',
        genericName: 'Albuterol',
        brandName: 'Ventolin, ProAir',
        category: 'SABA (Bronchodilator)',
        indication: 'Asthma, COPD exacerbation',
        mechanism: 'Beta-2 agonist.',
        sideEffects: ['Tremor', 'Tachycardia', 'Palpitations', 'Hypokalemia'],
        contraindications: ['Hypersensitivity to milk proteins (some powders)'],
        dosing: '2 puffs q4-6h PRN',
        monitoring: 'Lung sounds, HR'
    },
    // CARDIOLOGY EXPANSION
    'bisoprolol': {
        name: 'Bisoprolol',
        genericName: 'Bisoprolol',
        brandName: 'Zebeta',
        category: 'Beta-Blocker (Cardioselective)',
        indication: 'Hypertension, Stable Heart Failure',
        mechanism: 'Selective beta-1 adrenergic blocker.',
        sideEffects: ['Fatigue', 'Bradycardia', 'Dizziness', 'Cold extremities'],
        contraindications: ['Sinus bradycardia', '2nd/3rd degree heart block', 'Cardiogenic shock'],
        dosing: '5-10 mg daily',
        monitoring: 'HR, BP, signs of worsening HF'
    },
    'carvedilol': {
        name: 'Carvedilol',
        genericName: 'Carvedilol',
        brandName: 'Coreg',
        category: 'Beta-Blocker (Non-selective/Alpha-1 blocker)',
        indication: 'Heart Failure, Hypertension, LVD post-MI',
        mechanism: 'Non-selective beta blocker and alpha-1 blocker.',
        sideEffects: ['Dizziness', 'Fatigue', 'Weight gain', 'Bradycardia', 'Hypotension'],
        contraindications: ['Asthma (bronchospastic conditions)', 'Severe bradycardia', 'Decompensated HF'],
        dosing: '3.125-25 mg BID',
        monitoring: 'HR, BP, Renal function'
    },
    'valsartan': {
        name: 'Valsartan',
        genericName: 'Valsartan',
        brandName: 'Diovan',
        category: 'ARB',
        indication: 'Hypertension, Heart Failure, Post-MI',
        mechanism: 'Antagonist at the Angiotensin II type 1 (AT1) receptor.',
        sideEffects: ['Dizziness', 'Hyperkalemia', 'Hypotension', 'Renal impairment'],
        contraindications: ['Pregnancy'],
        dosing: '80-320 mg daily',
        monitoring: 'BP, K+, Creatinine'
    },
    'diltiazem': {
        name: 'Diltiazem',
        genericName: 'Diltiazem',
        brandName: 'Cardizem',
        category: 'Calcium Channel Blocker (Non-dihydropyridine)',
        indication: 'Angina, Hypertension, AFib/Flutter (rate control)',
        mechanism: 'Inhibits calcium ion influx during depolarization of cardiac and vascular smooth muscle.',
        sideEffects: ['Edema', 'Headache', 'Bradycardia', 'AV block', 'Constipation'],
        contraindications: ['Sick sinus syndrome', '2nd/3rd degree heart block', 'Severe hypotension'],
        dosing: '120-360 mg daily (CD/XR formulation)',
        monitoring: 'HR, BP, EKG'
    },
    'verapamil': {
        name: 'Verapamil',
        genericName: 'Verapamil',
        brandName: 'Calan',
        category: 'Calcium Channel Blocker (Non-dihydropyridine)',
        indication: 'Angina, Hypertension, SVT (rate control)',
        mechanism: 'Inhibits calcium ion influx; significantly slows AV conduction.',
        sideEffects: ['Constipation (common)', 'Dizziness', 'Gingival hyperplasia', 'Bradycardia'],
        contraindications: ['Severe LV dysfunction', 'Hypotension', 'Cardiogenic shock'],
        dosing: '180-480 mg daily (divided or SR)',
        monitoring: 'HR, BP, EKG'
    },
    'spironolactone': {
        name: 'Spironolactone',
        genericName: 'Spironolactone',
        brandName: 'Aldactone',
        category: 'Aldosterone Antagonist (K-sparing Diuretic)',
        indication: 'Heart Failure (HFrEF), Hypertension, Ascites, Hirsutism',
        mechanism: 'Competes with aldosterone for receptors in distal tubules.',
        sideEffects: ['Hyperkalemia', 'Gynecomastia', 'Renal impairment'],
        contraindications: ['Hyperkalemia (>5.0)', 'Anuria', 'Acute renal insufficiency'],
        dosing: '12.5-50 mg daily (HF); 25-200 mg (Ascites)',
        monitoring: 'K+, Creatinine, BP'
    },
    // DIABETES EXPANSION
    'empagliflozin': {
        name: 'Empagliflozin',
        genericName: 'Empagliflozin',
        brandName: 'Jardiance',
        category: 'SGLT2 Inhibitor',
        indication: 'T2DM, Heart Failure (HFrEF/HFpEF), CKD',
        mechanism: 'Inhibits SGLT2 in proximal tubule, reducing glucose reabsorption.',
        sideEffects: ['UTI', 'Genital mycotic infections', 'Polyuria', 'Hypovolemia', 'Ketoacidosis (rare)'],
        contraindications: ['Dialysis'],
        dosing: '10-25 mg daily',
        monitoring: 'Renal function, BP, Volume status'
    },
    'sitagliptin': {
        name: 'Sitagliptin',
        genericName: 'Sitagliptin',
        brandName: 'Januvia',
        category: 'DPP-4 Inhibitor',
        indication: 'Type 2 Diabetes',
        mechanism: 'Inhibits DPP-4 enzyme, increasing incretin hormone levels (GLP-1/GIP).',
        sideEffects: ['Upper respiratory infection', 'Headache', 'Pancreatitis (rare)'],
        contraindications: ['History of pancreatitis'],
        dosing: '100 mg daily (adjust for renal)',
        monitoring: 'Renal function'
    },
    'semaglutide': {
        name: 'Semaglutide',
        genericName: 'Semaglutide',
        brandName: 'Ozempic, Wegovy, Rybelsus',
        category: 'GLP-1 Receptor Agonist',
        indication: 'T2DM, Obesity (Weight loss), CV risk reduction',
        mechanism: 'Mimics GLP-1, increasing insulin secretion and slowing gastric emptying.',
        sideEffects: ['Nausea/Vomiting (common)', 'Diarrhea', 'Abdominal pain', 'Pancreatitis'],
        contraindications: ['Medullary thyroid cancer history', 'Multiple Endocrine Neoplasia type 2'],
        dosing: '0.25-2 mg subcutaneously weekly; or oral daily',
        monitoring: 'A1C, Weight, GI symptoms'
    },
    // RESPIRATORY EXPANSION
    'fluticasone': {
        name: 'Fluticasone',
        genericName: 'Fluticasone',
        brandName: 'Flonase, Flovent',
        category: 'Inhaled Corticosteroid (ICS)',
        indication: 'Asthma, Allergic Rhinitis',
        mechanism: 'Potent anti-inflammatory activity; inhibits multiple cell types and mediator release.',
        sideEffects: ['Oral candidiasis (thrush)', 'Hoarseness (dysphonia)', 'Epistaxis (nasal)'],
        contraindications: ['Primary treatment of status asthmaticus'],
        dosing: '88-440 mcg BID (Inhaled)',
        monitoring: 'Lung sounds, growth in children'
    },
    'salmeterol': {
        name: 'Salmeterol',
        genericName: 'Salmeterol',
        brandName: 'Serevent',
        category: 'LABA (Bronchodilator)',
        indication: 'Asthma (adjunct), COPD',
        mechanism: 'Long-acting beta-2 agonist; relaxes bronchial smooth muscle.',
        sideEffects: ['Headache', 'Tremor', 'Tachycardia', 'Nervousness'],
        contraindications: ['Asthma monotherapy (must use with ICS)'],
        dosing: '50 mcg BID',
        monitoring: 'Frequency of SABA use, HR'
    },
    'tiotropium': {
        name: 'Tiotropium',
        genericName: 'Tiotropium',
        brandName: 'Spiriva',
        category: 'LAMA (Anticholinergic)',
        indication: 'COPD, Asthma',
        mechanism: 'Long-acting muscarinic antagonist; blocks M3 receptors in airway.',
        sideEffects: ['Dry mouth (common)', 'URI', 'Urinary retention', 'Constipation'],
        contraindications: ['Hypersensitivity to ipratropium or milk protein'],
        dosing: '18 mcg capsule inhalation daily',
        monitoring: 'Lung function, urinary symptoms'
    },
    // PSYCH / NEURO EXPANSION
    'gabapentin': {
        name: 'Gabapentin',
        genericName: 'Gabapentin',
        brandName: 'Neurontin',
        category: 'Anticonvulsant / Neuropathic Pain Agent',
        indication: 'Postherpetic neuralgia, Partial-onset seizures (adjunct)',
        mechanism: 'Structurally related to GABA; binds to voltage-gated calcium channels.',
        sideEffects: ['Somnolence', 'Dizziness', 'Peripheral edema', 'Ataxia'],
        contraindications: ['Hypersensitivity'],
        dosing: '300-600 mg TID',
        monitoring: 'Renal function, Suicidal ideation'
    },
    'pregabalin': {
        name: 'Pregabalin',
        genericName: 'Pregabalin',
        brandName: 'Lyrica',
        category: 'Anticonvulsant / Analgesic',
        indication: 'Diabetic neuropathy, Fibromyalgia, Neuralgia',
        mechanism: 'Binds to alpha-2-delta subunit of voltage-gated calcium channels.',
        sideEffects: ['Dizziness', 'Somnolence', 'Dry mouth', 'Edema', 'Weight gain'],
        contraindications: ['Hypersensitivity'],
        dosing: '75-150 mg BID',
        monitoring: 'Suicidal ideation, Renal function'
    },
    'venlafaxine': {
        name: 'Venlafaxine',
        genericName: 'Venlafaxine',
        brandName: 'Effexor',
        category: 'SNRI',
        indication: 'MDD, GAD, Social Anxiety, Panic Disorder',
        mechanism: 'Inhibits reuptake of both serotonin and norepinephrine.',
        sideEffects: ['Nausea', 'Sweating', 'Hypertension (dose-dependent)', 'Insomnia'],
        contraindications: ['MAOI use within 14 days'],
        dosing: '75-225 mg daily (ER)',
        monitoring: 'BP, Mood, Weight'
    },
    // ID / GI / OTHERS EXPANSION
    'levofloxacin': {
        name: 'Levofloxacin',
        genericName: 'Levofloxacin',
        brandName: 'Levaquin',
        category: 'Fluoroquinolone Antibiotic',
        indication: 'Pneumonia, UTI, Skin infections',
        mechanism: 'Inhibits DNA gyrase/topoisomerase IV.',
        sideEffects: ['Tendonitis/Rupture', 'QT prolongation', 'Peripheral neuropathy', 'C. diff'],
        contraindications: ['Myasthenia gravis', 'Hypersensitivity'],
        dosing: '250-750 mg daily',
        monitoring: 'Renal function, Tendon pain'
    },
    'doxycycline': {
        name: 'Doxycycline',
        genericName: 'Doxycycline',
        brandName: 'Vibramycin',
        category: 'Tetracycline Antibiotic',
        indication: 'Lyme disease, Acne, Chlamydia, CAP',
        mechanism: 'Inhibits protein synthesis (30S subunit).',
        sideEffects: ['Photosensitivity', 'GI upset', 'Tooth discoloration (children)'],
        contraindications: ['Pregnancy (2nd/3rd trimester)', 'Children < 8 years (short-term ok)'],
        dosing: '100 mg BID',
        monitoring: 'Skin (burns), Signs of esophagitis'
    },
    'metronidazole': {
        name: 'Metronidazole',
        genericName: 'Metronidazole',
        brandName: 'Flagyl',
        category: 'Antiprotozoal/Antibacterial',
        indication: 'Anaerobic infections, C. diff, Trichomoniasis',
        mechanism: 'Causes DNA strand breakage.',
        sideEffects: ['Metallic taste', 'Nausea', 'Disulfiram-like reaction with alcohol'],
        contraindications: ['Alcohol use within 3 days', '1st trimester pregnancy (Trich)'],
        dosing: '250-500 mg q8-12h',
        monitoring: 'Alcohol cessation'
    },
    'levothyroxine': {
        name: 'Levothyroxine',
        genericName: 'Levothyroxine',
        brandName: 'Synthroid',
        category: 'Thyroid Hormone',
        indication: 'Hypothyroidism',
        mechanism: 'Synthetic T4 replacement.',
        sideEffects: ['Hyperthyroidism symptoms (overdose)', 'Palpitations', 'Arrythmias'],
        contraindications: ['Adrenal insufficiency (untreated)', 'Acute MI'],
        dosing: '1.6 mcg/kg/day (titrate based on TSH)',
        monitoring: 'TSH every 6-8 weeks until stable'
    },
    'prednisone': {
        name: 'Prednisone',
        genericName: 'Prednisone',
        brandName: 'Deltasone',
        category: 'Corticosteroid',
        indication: 'Inflammation, Autoimmune conditions, Allergic reactions',
        mechanism: 'Glucocorticoid receptor agonist; inhibits inflammatory cytokines.',
        sideEffects: ['Hyperglycemia', 'Insomnia', 'Weight gain', 'Osteoporosis (long term)', 'Adrenal suppression'],
        contraindications: ['Systemic fungal infections', 'Live virus vaccines (high dose)'],
        dosing: '5-60 mg daily (taper if long term)',
        monitoring: 'Glucose, BP, Bone density'
    },
    'pantoprazole': {
        name: 'Pantoprazole',
        genericName: 'Pantoprazole',
        brandName: 'Protonix',
        category: 'PPI',
        indication: 'GERD, Erosive esophagitis, Zollinger-Ellison',
        mechanism: 'Irreversibly inhibits H+/K+ ATPase pump.',
        sideEffects: ['Headache', 'Abdominal pain', 'Hypomagnesemia', 'Osteopathic fractures'],
        contraindications: ['Hypersensitivity'],
        dosing: '40 mg daily',
        monitoring: 'Mg levels (long term)'
    },
    'ondansetron': {
        name: 'Ondansetron',
        genericName: 'Ondansetron',
        brandName: 'Zofran',
        category: '5-HT3 Antagonist (Antiemetic)',
        indication: 'Nausea and Vomiting (Chemo or Post-op)',
        mechanism: 'Blocks serotonin receptors in the chemoreceptor trigger zone and vagal nerve terminals.',
        sideEffects: ['Headache', 'Constipation', 'QT prolongation'],
        contraindications: ['Apomorphine use'],
        dosing: '4-8 mg q8h PRN',
        monitoring: 'ECG (if risk factors)'
    },
    // CARDIOVASCULAR BATCH 2
    'amiodarone': {
        name: 'Amiodarone',
        genericName: 'Amiodarone',
        brandName: 'Cordarone, Pacerone',
        category: 'Class III Anti-arrhythmic',
        indication: 'Ventricular fibrillation, Ventricular tachycardia',
        mechanism: 'Prolongs action potential and refractory period; inhibits adrenergic receptors.',
        sideEffects: ['Pulmonary toxicity', 'Thyroid dysfunction', 'Hepatotoxicity', 'Blue-gray skin discoloration', 'Corneal microdeposits'],
        contraindications: ['Sick sinus syndrome', '2nd/3rd degree AV block', 'Iodine allergy'],
        dosing: 'LD: 800-1600 mg/day for 1-3 weeks; MD: 200-400 mg daily',
        monitoring: 'LFTs, PFTs (CXR), Thyroid function, Eye exams'
    },
    'digoxin': {
        name: 'Digoxin',
        genericName: 'Digoxin',
        brandName: 'Lanoxin',
        category: 'Cardiac Glycoside',
        indication: 'Heart failure, Atrial fibrillation',
        mechanism: 'Inhibits Na+/K+ ATPase pump, increasing intracellular calcium and contractility.',
        sideEffects: ['Nausea/Vomiting', 'Blurred vision (yellow/green halos)', 'Arrythmias', 'Bradycardia'],
        contraindications: ['Ventricular fibrillation', 'Hypersensitivity'],
        dosing: '0.125-0.25 mg daily (Adjust for renal function)',
        monitoring: 'Serum digoxin levels, K+, Creatinine, HR'
    },
    'nitroglycerin': {
        name: 'Nitroglycerin',
        genericName: 'Nitroglycerin',
        brandName: 'Nitrostat, Nitrolingual',
        category: 'Nitrate (Vasodilator)',
        indication: 'Angina pectoris (treatment and prophylaxis)',
        mechanism: 'Forms free radical nitric oxide, increasing cGMP and causing smooth muscle relaxation.',
        sideEffects: ['Headache (severe)', 'Hypotension', 'Flushing', 'Dizziness'],
        contraindications: ['PDE-5 inhibitor use (e.g., Sildenafil)', 'Severe anemia', 'Increased ICP'],
        dosing: '0.3-0.6 mg SL q5min (max 3 doses in 15 min)',
        monitoring: 'BP, HR, Pain relief'
    },
    'hydralazine': {
        name: 'Hydralazine',
        genericName: 'Hydralazine',
        brandName: 'Apresoline',
        category: 'Vasodilator',
        indication: 'Hypertension, Heart Failure (with nitrates)',
        mechanism: 'Direct vasodilation of arterioles (not veins).',
        sideEffects: ['Tachycardia', 'Headache', 'Drug-induced Lupus (long term)', 'Palpitations'],
        contraindications: ['CAD', 'Mitral valvular rheumatic heart disease'],
        dosing: '10-50 mg qID',
        monitoring: 'BP, ANA (if lupus symptoms)'
    },
    // ID BATCH 2
    'acyclovir': {
        name: 'Acyclovir',
        genericName: 'Acyclovir',
        brandName: 'Zovirax',
        category: 'Antiviral',
        indication: 'Herpes simplex, Varicella-zoster (Shingles)',
        mechanism: 'Inhibits viral DNA synthesis by competitive inhibition of viral DNA polymerase.',
        sideEffects: ['Renal toxicity (crystalline nephropathy)', 'Malaise', 'Nausea'],
        contraindications: ['Hypersensitivity'],
        dosing: '200-800 mg 3-5 times/day',
        monitoring: 'Renal function, Hydration status'
    },
    'fluconazole': {
        name: 'Fluconazole',
        genericName: 'Fluconazole',
        brandName: 'Diflucan',
        category: 'Antifungal',
        indication: 'Candidiasis, Cryptococcal meningitis',
        mechanism: 'Inhibits fungal CYP450-dependent synthesis of ergosterol.',
        sideEffects: ['Hepatotoxicity', 'QT prolongation', 'Nausea', 'Abdominal pain'],
        contraindications: ['Coadministration with CYP3A4 substrates that prolong QT'],
        dosing: '150 mg single dose (vaginal) or 100-400 mg daily',
        monitoring: 'LFTs, K+, ECG'
    },
    'vancomycin': {
        name: 'Vancomycin',
        genericName: 'Vancomycin',
        brandName: 'Vancocin',
        category: 'Glycopeptide Antibiotic',
        indication: 'MRSA infections, C. difficile (oral)',
        mechanism: 'Inhibits bacterial cell wall synthesis by binding to D-alanyl-D-alanine.',
        sideEffects: ['Nephrotoxicity', 'Ototoxicity', 'Red Man Syndrome (infusion related)'],
        contraindications: ['Hypersensitivity'],
        dosing: '15-20 mg/kg q8-12h (IV); 125-500 mg q6h (Oral for C.diff)',
        monitoring: 'Serum troughs (10-20 mcg/mL), SCr, Hearing'
    },
    'piperacillin-tazobactam': {
        name: 'Piperacillin-Tazobactam',
        genericName: 'Piperacillin-Tazobactam',
        brandName: 'Zosyn',
        category: 'Penicillin / Beta-lactamase Inhibitor',
        indication: 'Pneumonia, Intra-abdominal infections, Sepsis',
        mechanism: 'Piperacillin inhibits cell wall synthesis; Tazobactam inhibits beta-lactamase.',
        sideEffects: ['Diarrhea', 'Rash', 'Thrombocytopenia', 'Electrolyte imbalance'],
        contraindications: ['Penicillin allergy'],
        dosing: '3.375g - 4.5g q6h IV',
        monitoring: 'Renal function, CBC, K+'
    },
    // NEURO/PSYCH BATCH 2
    'risperidone': {
        name: 'Risperidone',
        genericName: 'Risperidone',
        brandName: 'Risperdal',
        category: 'Atypical Antipsychotic',
        indication: 'Schizophrenia, Bipolar mania, Irritability in autism',
        mechanism: 'D2 and 5-HT2A receptor antagonist.',
        sideEffects: ['EPS', 'Hyperprolactinemia', 'Weight gain', 'Sedation'],
        contraindications: ['Hypersensitivity'],
        dosing: '1-6 mg daily',
        monitoring: 'Prolactin, Weight, Metabolic profile'
    },
    'quetiapine': {
        name: 'Quetiapine',
        genericName: 'Quetiapine',
        brandName: 'Seroquel',
        category: 'Atypical Antipsychotic',
        indication: 'Schizophrenia, Bipolar disorder, Depression (adjunct)',
        mechanism: 'Antagonist at D2, 5-HT2, H1, and alpha-1/2 receptors.',
        sideEffects: ['Sedation (strong)', 'Weight gain', 'Xerostomia', 'Orthostatic hypotension'],
        contraindications: ['Hypersensitivity'],
        dosing: '25-800 mg daily (divided or XR)',
        monitoring: 'Eye exams (cataracts in animals), Fasting glucose/lipids'
    },
    'haloperidol': {
        name: 'Haloperidol',
        genericName: 'Haloperidol',
        brandName: 'Haldol',
        category: 'Typical Antipsychotic',
        indication: 'Psychosis, Tourette syndrome, Agitation',
        mechanism: 'Potent D2 receptor antagonist.',
        sideEffects: ['Severe EPS', 'Tardive dyskinesia', 'QT prolongation', 'NMS'],
        contraindications: ['Parkinson disease', 'Dementia with Lewy bodies', 'Severe CNS depression'],
        dosing: '0.5-20 mg daily',
        monitoring: 'AIMS scale, ECG'
    },
    'carbamazepine': {
        name: 'Carbamazepine',
        genericName: 'Carbamazepine',
        brandName: 'Tegretol',
        category: 'Antiepileptic / Mood Stabilizer',
        indication: 'Seizures, Trigeminal neuralgia, Bipolar disorder',
        mechanism: 'Inhibits voltage-gated sodium channels.',
        sideEffects: ['Hyponatremia (SIADH)', 'Leukopenia', 'Rash (SJS/TEN in HLA-B*1502)', 'Autoinduction'],
        contraindications: ['Bone marrow suppression', 'MAOI use'],
        dosing: '400-1200 mg daily',
        monitoring: 'CBC, Na+, Serum levels (4-12 mcg/mL), LFTs'
    },
    'valproate': {
        name: 'Valproate',
        genericName: 'Valproic Acid / Sodium Valproate',
        brandName: 'Depakote',
        category: 'Antiepileptic / Mood Stabilizer',
        indication: 'Seizures, Bipolar mania, Migraine prophylaxis',
        mechanism: 'Increases GABA levels; inhibits Na+ channels and T-type Ca2+ channels.',
        sideEffects: ['Hepatotoxicity (black box)', 'Pancreatitis', 'Weight gain', 'Alopecia', 'Teratogenicity'],
        contraindications: ['Hepatic disease', 'Urea cycle disorders', 'Pregnancy (migraine)'],
        dosing: '500-2000 mg daily',
        monitoring: 'LFTs, CBC, Serum levels (50-100 mcg/mL), Pregnancy test'
    },
    'lamotrigine': {
        name: 'Lamotrigine',
        genericName: 'Lamotrigine',
        brandName: 'Lamictal',
        category: 'Antiepileptic / Mood Stabilizer',
        indication: 'Bipolar maintenance, Seizures',
        mechanism: 'Inhibits glutamate release; inhibits Na+ channels.',
        sideEffects: ['Rash (SJS/TEN risk)', 'Dizziness', 'Diplopia'],
        contraindications: ['Hypersensitivity'],
        dosing: '100-400 mg daily (Start very slow)',
        monitoring: 'Skin assessment'
    },
    // GI / RESPIRATORY BATCH 2
    'loperamide': {
        name: 'Loperamide',
        genericName: 'Loperamide',
        brandName: 'Imodium',
        category: 'Antidiarrheal',
        indication: 'Diarrhea',
        mechanism: 'Opioid agonist in the GI tract; slows motility.',
        sideEffects: ['Constipation', 'Abdominal cramps', 'QT prolongation (high doses)'],
        contraindications: ['C. diff infection', 'Acute ulcerative colitis', 'Bloody diarrhea'],
        dosing: '4 mg initially, then 2 mg after each loose stool (Max 16mg/day)',
        monitoring: 'Bowel sounds'
    },
    'metoclopramide': {
        name: 'Metoclopramide',
        genericName: 'Metoclopramide',
        brandName: 'Reglan',
        category: 'Dopamine Antagonist / Prokinetic',
        indication: 'Gastroparesis, GERD, Nausea',
        mechanism: 'Blocks dopamine receptors; increases upper GI motility.',
        sideEffects: ['Tardive dyskinesia (Black Box)', 'Drowsiness', 'Restlessness'],
        contraindications: ['GI obstruction, Perforation, Pheochromocytoma'],
        dosing: '5-10 mg TID before meals',
        monitoring: 'AIMS scale (for long term use)'
    },
    'montelukast': {
        name: 'Montelukast',
        genericName: 'Montelukast',
        brandName: 'Singulair',
        category: 'Leukotriene Receptor Antagonist (LTRA)',
        indication: 'Asthma, Allergic rhinitis',
        mechanism: 'Selective leukotriene receptor antagonist.',
        sideEffects: ['Neuropsychiatric events (vivid dreams, agitation)', 'Headache'],
        contraindications: ['Hypersensitivity'],
        dosing: '10 mg once daily (evening)',
        monitoring: 'Behavior/Mood changes'
    },
    'polyethylene-glycol': {
        name: 'Polyethylene Glycol 3350',
        genericName: 'PEG 3350',
        brandName: 'MiraLAX',
        category: 'Osmotic Laxative',
        indication: 'Constipation',
        mechanism: 'Osmotic agent that binds water to the stool.',
        sideEffects: ['Bloating', 'Nausea', 'Abdominal cramps'],
        contraindications: ['Bowel obstruction'],
        dosing: '17 g daily dissolved in liquid',
        monitoring: 'Bowel frequency'
    },
    // SPECIALIZED ACUTE & CHRONIC BATCH 4
    'lithium': {
        name: 'Lithium',
        genericName: 'Lithium Carbonate',
        brandName: 'Lithobid, Eskalith',
        category: 'Mood Stabilizer',
        indication: 'Bipolar disorder (mania and maintenance)',
        mechanism: 'Alters cation transport in nerve/muscle cells; influences reuptake of neurotransmitters.',
        sideEffects: ['Hand tremor', 'Polyuria/Polydipsia', 'Hypothyroidism', 'Nausea', 'Leukocytosis'],
        contraindications: ['Severe renal disease', 'Significant cardiovascular disease', 'Dehydration'],
        dosing: '600-1200 mg daily (divided)',
        monitoring: 'Serum levels (0.6-1.2 mEq/L), TSH, Renal function (Cr/BUN), Electrolytes'
    },
    'methotrexate': {
        name: 'Methotrexate',
        genericName: 'Methotrexate',
        brandName: 'Rheumatrex, Trexall',
        category: 'Antirheumatic (DMARD) / Antineoplastic',
        indication: 'Rheumatoid arthritis, Psoriasis, Leukemia',
        mechanism: 'Inhibits dihydrofolate reductase, interfering with DNA synthesis.',
        sideEffects: ['Hepatotoxicity', 'Myelosuppression', 'Mucositis', 'Pneumonitis'],
        contraindications: ['Pregnancy (Category X)', 'Alcoholism', 'Chronic liver disease'],
        dosing: '7.5-25 mg ONCE WEEKLY (RA/Psoriasis)',
        monitoring: 'CBC, LFTs, Creatinine, Pregnancy tests'
    },
    'gentamicin': {
        name: 'Gentamicin',
        genericName: 'Gentamicin',
        brandName: 'Garamycin',
        category: 'Aminoglycoside Antibiotic',
        indication: 'Serious gram-negative infections, Endocarditis (adjunct)',
        mechanism: 'Irreversibly binds to 30S ribosomal subunit, causing misreading of mRNA.',
        sideEffects: ['Nephrotoxicity (acute tubular necrosis)', 'Ototoxicity (irreversible)', 'Neuromuscular blockade'],
        contraindications: ['Hypersensitivity to aminoglycosides'],
        dosing: '3-7 mg/kg daily (IV) - base on weight/extended interval dosing',
        monitoring: 'Serum peaks/troughs, Serum Creatinine, Hearing'
    },
    'cyclosporine': {
        name: 'Cyclosporine',
        genericName: 'Cyclosporine',
        brandName: 'Sandimmune, Neoral',
        category: 'Immunosuppressant (Calcineurin Inhibitor)',
        indication: 'Organ transplant rejection prophylaxis, RA, Psoriasis',
        mechanism: 'Inhibits T-lymphocyte activation by blocking calcineurin.',
        sideEffects: ['Nephrotoxicity', 'Hypertension', 'Hirsutism', 'Gingival hyperplasia', 'Tremor'],
        contraindications: ['Abnormal renal function', 'Uncontrolled hypertension', 'Malignancies'],
        dosing: '2-15 mg/kg daily (divided)',
        monitoring: 'Trough levels, Creatinine, BP, LFTs, K+, Mg'
    },
    'tacrolimus': {
        name: 'Tacrolimus',
        genericName: 'Tacrolimus',
        brandName: 'Prograf',
        category: 'Immunosuppressant (Calcineurin Inhibitor)',
        indication: 'Organ transplant rejection prophylaxis',
        mechanism: 'Inhibits T-lymphocyte activation.',
        sideEffects: ['Nephrotoxicity', 'Neurotoxicity (tremor, headache)', 'Hyperglycemia', 'Hyperkalemia'],
        contraindications: ['Hypersensitivity'],
        dosing: '0.05-0.2 mg/kg daily (divided)',
        monitoring: 'Trough levels (narrow therapeutic window), Creatinine, Glucose, K+'
    },
    'morphine': {
        name: 'Morphine',
        genericName: 'Morphine Sulfate',
        brandName: 'MS Contin, Kadian',
        category: 'Opioid Analgesic',
        indication: 'Severe acute or chronic pain',
        mechanism: 'Mu-opioid receptor agonist in the CNS.',
        sideEffects: ['Respiratory depression', 'Constipation', 'Sedation', 'Pruritus', 'Hypotension'],
        contraindications: ['Acute respiratory depression', 'GI obstruction (ileus)'],
        dosing: '15-60 mg q8-12h (Extended release); 2-10 mg q4h (Immediate release)',
        monitoring: 'Respiratory rate, Pain level, Bowel function'
    },
    'fentanyl': {
        name: 'Fentanyl',
        genericName: 'Fentanyl',
        brandName: 'Duragesic (Patch), Sublimaze (IV)',
        category: 'Opioid Analgesic',
        indication: 'Severe chronic pain (Patch), Anesthesia',
        mechanism: 'Potent mu-opioid receptor agonist.',
        sideEffects: ['Respiratory depression', 'Sedation', 'Constipation', 'Application site reaction (patch)'],
        contraindications: ['Opioid-naive patients (for Patch)', 'Acute/PRN pain'],
        dosing: '12-100 mcg/hr q72h (Patch); 25-100 mcg (IV dose)',
        monitoring: 'Respiratory rate, Pain level'
    },
    // CARDIOVASCULAR & ENDOCRINE expansion BATCH 5
    'clopidogrel': {
        name: 'Clopidogrel',
        genericName: 'Clopidogrel',
        brandName: 'Plavix',
        category: 'Antiplatelet (P2Y12 Inhibitor)',
        indication: 'ACS, Recent MI/Stroke, PAD',
        mechanism: 'Irreversibly inhibits P2Y12 ADP receptors on platelets.',
        sideEffects: ['Bleeding', 'TTP (rare)', 'Bruising'],
        contraindications: ['Active pathological bleeding'],
        dosing: '75 mg daily (Loading dose 300-600 mg)',
        monitoring: 'Signs of bleeding, CBC'
    },
    'ticagrelor': {
        name: 'Ticagrelor',
        genericName: 'Ticagrelor',
        brandName: 'Brilinta',
        category: 'Antiplatelet (P2Y12 Inhibitor)',
        indication: 'ACS, Prevention of stent thrombosis',
        mechanism: 'Reversible P2Y12 receptor antagonist.',
        sideEffects: ['Bleeding', 'Dyspnea', 'Bradyarrhythmias'],
        contraindications: ['Active bleeding', 'History of ICH', 'Severe hepatic impairment'],
        dosing: '90 mg BID (with Aspirin 81mg)',
        monitoring: 'Bleeding, HR'
    },
    'bumetanide': {
        name: 'Bumetanide',
        genericName: 'Bumetanide',
        brandName: 'Bumex',
        category: 'Loop Diuretic',
        indication: 'Edema (HF, Renal disease, Cirrhosis)',
        mechanism: 'Inhibits sodium-potassium-chloride symporter in the thick ascending limb of Henle.',
        sideEffects: ['Hypokalemia', 'Dizziness', 'Otoneurotoxicity', 'Hypomagnesemia'],
        contraindications: ['Anuria', 'Severe electrolyte depletion'],
        dosing: '0.5 - 2 mg daily (Max 10mg/day)',
        monitoring: 'Electrolytes, Renal function, BP'
    },
    'torsemide': {
        name: 'Torsemide',
        genericName: 'Torsemide',
        brandName: 'Demadex',
        category: 'Loop Diuretic',
        indication: 'Edema, Hypertension',
        mechanism: 'Inhibits Na+/K+/2Cl- carrier system in Henle loop.',
        sideEffects: ['Excessive urination', 'Hypokalemia', 'Orthostatic hypotension'],
        contraindications: ['Anuria'],
        dosing: '10-20 mg daily',
        monitoring: 'Electrolytes, BP'
    },
    'chlorthalidone': {
        name: 'Chlorthalidone',
        genericName: 'Chlorthalidone',
        brandName: 'Thalitone',
        category: 'Thiazide-like Diuretic',
        indication: 'Hypertension, Edema',
        mechanism: 'Inhibits sodium and chloride reabsorption in the distal convoluted tubule.',
        sideEffects: ['Hypokalemia', 'Hyperuricemia (gout)', 'Hypercalcemia', 'Hyponatremia'],
        contraindications: ['Anuria', 'Hypersensitivity to sulfonamides'],
        dosing: '12.5-25 mg daily',
        monitoring: 'Electrolytes, BP, Uric acid'
    },
    'isosorbide-mononitrate': {
        name: 'Isosorbide Mononitrate',
        genericName: 'Isosorbide Mononitrate',
        brandName: 'Imdur',
        category: 'Nitrate (Vasodilator)',
        indication: 'Angina pectoris prevention',
        mechanism: 'Relaxes vascular smooth muscle via nitric oxide formation.',
        sideEffects: ['Headache (very common)', 'Dizziness', 'Hypotension'],
        contraindications: ['PDE-5 inhibitor use', 'Severe anemia'],
        dosing: '30-120 mg daily (Extended release)',
        monitoring: 'BP, Angina frequency'
    },
    // HEMATOLOGY & RHEUMATOLOGY BATCH 6
    'heparin': {
        name: 'Heparin',
        genericName: 'Heparin Sodium',
        brandName: 'Heparin',
        category: 'Anticoagulant',
        indication: 'DVT/PE treatment and prophylaxis, ACS',
        mechanism: 'Accelerates activity of antithrombin III, inactivating Thrombin (IIa) and Factor Xa.',
        sideEffects: ['Bleeding', 'Thrombocytopenia (HIT)', 'Osteoporosis (long term)'],
        contraindications: ['Uncontrolled bleeding', 'History of HIT', 'Severe thrombocytopenia'],
        dosing: '80 units/kg bolus, then 18 units/kg/hr infusion (adjusted by aPTT)',
        monitoring: 'aPTT or Anti-Xa levels, Platelets, Hgb'
    },
    'enoxaparin': {
        name: 'Enoxaparin',
        genericName: 'Enoxaparin',
        brandName: 'Lovenox',
        category: 'LMWH (Anticoagulant)',
        indication: 'DVT/PE treatment/prophylaxis, ACS',
        mechanism: 'Potentiates antithrombin III, primarily inhibiting Factor Xa.',
        sideEffects: ['Bleeding', 'Anemia', 'Injection site hematoma', 'HIT (lower risk than Heparin)'],
        contraindications: ['Active bleeding', 'History of HIT'],
        dosing: '1 mg/kg SC q12h (treatment) or 30-40mg SC daily (prophylaxis)',
        monitoring: 'Anti-Xa levels (in obesity/renal), Renal function, CBC'
    },
    'adalimumab': {
        name: 'Adalimumab',
        genericName: 'Adalimumab',
        brandName: 'Humira',
        category: 'TNF-alpha Inhibitor (Biologic DMARD)',
        indication: 'Rheumatoid Arthritis, Crohn Disease, Plaque Psoriasis',
        mechanism: 'Recombinant monoclonal antibody that binds to TNF-alpha, reducing inflammation.',
        sideEffects: ['Infection risk (TB, fungal)', 'Injection site reaction', 'Demyelinating disease risk'],
        contraindications: ['Active infection', 'Moderate to severe Heart Failure'],
        dosing: '40 mg SC every other week',
        monitoring: 'TB screening (baseline/annual), Signs of infection, CBC'
    },
    'sulfasalazine': {
        name: 'Sulfasalazine',
        genericName: 'Sulfasalazine',
        brandName: 'Azulfidine',
        category: 'DMARD / 5-ASA',
        indication: 'Rheumatoid Arthritis, Ulcerative Colitis',
        mechanism: 'Metabolized to sulfapyridine and 5-ASA; reduces inflammation.',
        sideEffects: ['Nausea', 'Skin rash', 'Gingival discoloration (yellow-orange)', 'Leukopenia'],
        contraindications: ['Sulfa or Salicylate allergy', 'Intestinal/Urinary obstruction'],
        dosing: '1000 mg BID/TID',
        monitoring: 'CBC, LFTs, Renal function'
    },
    // EMERGENCY & ACUTE CARE BATCH 6
    'epinephrine': {
        name: 'Epinephrine',
        genericName: 'Epinephrine',
        brandName: 'EpiPen, Adrenalin',
        category: 'Alpha/Beta Agonist (Sympathomimetic)',
        indication: 'Anaphylaxis, Cardiac arrest, Severe asthma',
        mechanism: 'Stimulates alpha-1, beta-1, and beta-2 adrenergic receptors.',
        sideEffects: ['Tachycardia', 'Palpitations', 'Anxiety', 'Hypertension', 'Arrythmias'],
        contraindications: ['No contraindications in emergency settings'],
        dosing: '0.3 mg IM (Anaphylaxis); 1 mg IV q3-5 min (Cardiac Arrest)',
        monitoring: 'HR, BP, Rhythm'
    },
    'adenosine': {
        name: 'Adenosine',
        genericName: 'Adenosine',
        brandName: 'Adenocard',
        category: 'Anti-arrhythmic',
        indication: 'PSVT (Paroxysmal Supraventricular Tachycardia)',
        mechanism: 'Slows conduction time through the AV node; interrupts reentry pathways.',
        sideEffects: ['Facial flushing', 'Chest pain/pressure', 'Dyspnea', 'Transient asystole'],
        contraindications: ['2nd/3rd degree AV block', 'Sick sinus syndrome'],
        dosing: '6 mg rapid IV push; followed by 12 mg if needed',
        monitoring: 'Continuous ECG'
    },
    'atropine': {
        name: 'Atropine',
        genericName: 'Atropine',
        brandName: 'Atropine',
        category: 'Anticholinergic',
        indication: 'Symptomatic bradycardia, Organophosphate poisoning',
        mechanism: 'Competitive antagonist of acetylcholine at postganglionic muscarinic receptors.',
        sideEffects: ['Xerostomia', 'Blurred vision', 'Tachycardia', 'Urinary retention'],
        contraindications: ['Glaucoma (relative)', 'Obstructive GI disease'],
        dosing: '0.5 - 1 mg IV q3-5 min (Max 3mg)',
        monitoring: 'HR, BP, Rhythm'
    },
    'propofol': {
        name: 'Propofol',
        genericName: 'Propofol',
        brandName: 'Diprivan',
        category: 'General Anesthetic / Sedative',
        indication: 'Induction/Maintenance of anesthesia, ICU sedation',
        mechanism: 'GABA-A receptor agonist.',
        sideEffects: ['Hypotension', 'Respiratory depression', 'Propofol infusion syndrome (PRIS)', 'Hypertriglyceridemia'],
        contraindications: ['Allergy to egg or soy'],
        dosing: '5-50 mcg/kg/min titration',
        monitoring: 'BP, RR, HR, Triglycerides'
    },
    // ONCOLOGY & GYN BATCH 7
    'tamoxifen': {
        name: 'Tamoxifen',
        genericName: 'Tamoxifen',
        brandName: 'Nolvadex, Soltamox',
        category: 'Selective Estrogen Receptor Modulator (SERM)',
        indication: 'Breast cancer (treatment and risk reduction)',
        mechanism: 'Competitively inhibits estrogen binding in breast tissue.',
        sideEffects: ['Hot flashes', 'Thromboembolism', 'Endometrial cancer risk', 'Vaginal discharge'],
        contraindications: ['History of DVT/PE requiring anticoagulation', 'Pregnancy'],
        dosing: '20 mg daily',
        monitoring: 'Annual GYN exam, Signs of DVT/PE'
    },
    'imatinib': {
        name: 'Imatinib',
        genericName: 'Imatinib',
        brandName: 'Gleevec',
        category: 'Tyrosine Kinase Inhibitor (TKI)',
        indication: 'CML, GIST',
        mechanism: 'Inhibits Bcr-Abl tyrosine kinase.',
        sideEffects: ['Fluid retention (edema)', 'Nausea/Vomiting', 'Muscle cramps', 'Myelosuppression'],
        contraindications: ['Hypersensitivity'],
        dosing: '400-600 mg daily',
        monitoring: 'CBC, LFTs, Weight'
    },
    'oxytocin': {
        name: 'Oxytocin',
        genericName: 'Oxytocin',
        brandName: 'Pitocin',
        category: 'Oxytocic Agent',
        indication: 'Labor induction, Postpartum hemorrhage',
        mechanism: 'Stimulates uterine smooth muscle contraction.',
        sideEffects: ['Uterine tachysystole', 'Water intoxication (hyponatremia)', 'Hypotension'],
        contraindications: ['Significant cephalopelvic disproportion', 'Fetal distress'],
        dosing: '0.5 - 20 mU/min IV titration',
        monitoring: 'Fetal heart rate, Uterine activity, BP'
    },
    'magnesium-sulfate': {
        name: 'Magnesium Sulfate',
        genericName: 'Magnesium Sulfate',
        brandName: 'Magnesium Sulfate',
        category: 'Electrolyte / Anticonvulsant',
        indication: 'Pre-eclampsia/Eclampsia (seizure prevention)',
        mechanism: 'Blocks neuromuscular transmission; depresses CNS.',
        sideEffects: ['Flushing', 'Hyporeflexia', 'Respiratory depression', 'Hypotension'],
        contraindications: ['Heart block', 'Myasthenia gravis', 'Renal failure'],
        dosing: '4-6 g loading dose, then 1-2 g/hr infusion',
        monitoring: 'Deep tendon reflexes, RR, Urine output, Mg levels'
    },
    // NEUROLOGY expansion BATCH 7
    'levodopa-carbidopa': {
        name: 'Levodopa/Carbidopa',
        genericName: 'Levodopa/Carbidopa',
        brandName: 'Sinemet',
        category: 'Anti-parkinson Agent',
        indication: 'Parkinson Disease',
        mechanism: 'Levodopa is converted to dopamine; Carbidopa inhibits peripheral decarboxylation.',
        sideEffects: ['Dyskinesia', 'Orthostatic hypotension', 'Nausea', 'Hallucinations', 'Dark urine/sweat'],
        contraindications: ['Narrow-angle glaucoma', 'MAOI use'],
        dosing: '25/100 mg TID initial; titrate to response',
        monitoring: 'Functional status, BP'
    },
    'donepezil': {
        name: 'Donepezil',
        genericName: 'Donepezil',
        brandName: 'Aricept',
        category: 'Acetylcholinesterase Inhibitor',
        indication: "Alzheimer's Dementia",
        mechanism: 'Reversibly inhibits acetylcholinesterase, increasing ACh at synapses.',
        sideEffects: ['Nausea/Diarrhea', 'Bradycardia', 'Insomnia/Vivid dreams', 'Syncope'],
        contraindications: ['Severe cardiac conduction abnormalities'],
        dosing: '5-10 mg daily (at bedtime)',
        monitoring: 'Weight, Cognitive status, HR'
    },
    'memantine': {
        name: 'Memantine',
        genericName: 'Memantine',
        brandName: 'Namenda',
        category: 'NMDA Receptor Antagonist',
        indication: "Moderate-Severe Alzheimer's Disease",
        mechanism: 'Uncompetitive NMDA receptor antagonist; regulates glutamate activity.',
        sideEffects: ['Dizziness', 'Confusion', 'Headache', 'Constipation'],
        contraindications: ['Hypersensitivity'],
        dosing: '5-20 mg daily (divided or XR)',
        monitoring: 'Renal function, Cognitive status'
    },
    'sumatriptan': {
        name: 'Sumatriptan',
        genericName: 'Sumatriptan',
        brandName: 'Imitrex',
        category: 'Serotonin 5-HT1B/1D Agonist (Triptan)',
        indication: 'Acute Migraine with or without aura',
        mechanism: 'Causes vasoconstriction of cranial arteries.',
        sideEffects: ['Chest pressure/tightness', 'Flushing', 'Paresthesia', 'Dizziness'],
        contraindications: ['Ischemic heart disease', 'Uncontrolled HTN', 'Ischemic stroke', 'PVD'],
        dosing: '25-100 mg PO; 4-6 mg SC',
        monitoring: 'Frequency of use, BP (if risk factors)'
    },
    'topiramate': {
        name: 'Topiramate',
        genericName: 'Topiramate',
        brandName: 'Topamax',
        category: 'Antiepileptic',
        indication: 'Seizures, Migraine prophylaxis, Weight loss (adjunct)',
        mechanism: 'Blocks Na+ channels; potentiates GABA; antagonizes glutamate.',
        sideEffects: ['Cognitive slowing (word-finding)', 'Paresthesia', 'Weight loss', 'Kidney stones', 'Glaucoma'],
        contraindications: ['Hypersensitivity'],
        dosing: '25-200 mg BID',
        monitoring: 'CO2 levels (metabolic acidosis), Renal function'
    },
    // PEDIATRICS & OTC BATCH 8
    'amoxicillin-clavulanate': {
        name: 'Amoxicillin/Clavulanate',
        genericName: 'Amoxicillin/Clavulanate',
        brandName: 'Augmentin',
        category: 'Penicillin Antibiotic',
        indication: 'Otitis media, Sinusitis, Community-acquired pneumonia',
        mechanism: 'Amoxicillin inhibits cell wall synthesis; Clavulanate inhibits beta-lactamase.',
        sideEffects: ['Diarrhea (common)', 'Nausea', 'Rash', 'Candidiasis'],
        contraindications: ['History of penicillin-associated cholestatic jaundice/hepatic dysfunction', 'Penicillin allergy'],
        dosing: '45-90 mg/kg/day (Amoxicillin component) divided BID (Pediatric)',
        monitoring: 'Signs of anaphylaxis, Renal/Hepatic function (long term)'
    },
    'cefdinir': {
        name: 'Cefdinir',
        genericName: 'Cefdinir',
        brandName: 'Omnicef',
        category: '3rd Generation Cephalosporin',
        indication: 'Otitis media, Sinusitis, Skin/Soft tissue infections',
        mechanism: 'Inhibits bacterial cell wall synthesis.',
        sideEffects: ['Diarrhea', 'Red stools (if taken with iron)'],
        contraindications: ['Cephalosporin allergy'],
        dosing: '14 mg/kg/day once daily or divided BID',
        monitoring: 'Signs of allergy'
    },
    'prednisolone-liquid': {
        name: 'Prednisolone',
        genericName: 'Prednisolone',
        brandName: 'Prelone, Orapred',
        category: 'Corticosteroid',
        indication: 'Asthma exacerbation, Croup, Inflammation',
        mechanism: 'Glucocorticoid receptor agonist; inhibits inflammation.',
        sideEffects: ['Irritability', 'Increased appetite', 'Hyperglycemia', 'Insomnia'],
        contraindications: ['Systemic fungal infections'],
        dosing: '1-2 mg/kg/day (Max 60mg) for 3-5 days',
        monitoring: 'BP, Growth (long term)'
    },
    'albuterol-nebulizer': {
        name: 'Albuterol (Nebulized)',
        genericName: 'Albuterol',
        brandName: 'AccuNeb',
        category: 'Beta-2 Agonist (SABA)',
        indication: 'Acute bronchospasm (Asthma, COPD)',
        mechanism: 'Relaxes bronchial smooth muscle via beta-2 stimulation.',
        sideEffects: ['Tachycardia', 'Tremor', 'Hypokalemia'],
        contraindications: ['Hypersensitivity'],
        dosing: '2.5 mg q20min x3 doses (acute) then q1-4h PRN',
        monitoring: 'HR, Lung sounds, O2 sat'
    },
    'valacyclovir': {
        name: 'Valacyclovir',
        genericName: 'Valacyclovir',
        brandName: 'Valtrex',
        category: 'Antiviral',
        indication: 'Herpes labialis, Shingles, Genital herpes',
        mechanism: 'Prodrug of acyclovir; inhibits viral DNA synthesis.',
        sideEffects: ['Headache', 'Nausea', 'Abdominal pain'],
        contraindications: ['Hypersensitivity'],
        dosing: '500 mg - 2000 mg 1-3 times daily',
        monitoring: 'Renal function'
    },
    'diphenhydramine': {
        name: 'Diphenhydramine',
        genericName: 'Diphenhydramine',
        brandName: 'Benadryl',
        category: '1st Generation Antihistamine',
        indication: 'Allergies, Insomnia, Motion sickness, Anaphylaxis (adjunct)',
        mechanism: 'H1 receptor antagonist; CNS depressant; anticholinergic.',
        sideEffects: ['Sedation', 'Xerostomia', 'Paradoxical excitement (children)', 'Urinary retention'],
        contraindications: ['Neonates', 'Lactation', 'Narrow-angle glaucoma (relative)'],
        dosing: '25-50 mg q6-8h',
        monitoring: 'Mental status'
    },
    'cetirizine': {
        name: 'Cetirizine',
        genericName: 'Cetirizine',
        brandName: 'Zyrtec',
        category: '2nd Generation Antihistamine',
        indication: 'Allergic rhinitis, Urticaria',
        mechanism: 'Selective peripheral H1 receptor antagonist.',
        sideEffects: ['Drowsiness (more than other 2nd gen)', 'Xerostomia'],
        contraindications: ['Hypersensitivity'],
        dosing: '5-10 mg daily',
        monitoring: 'Relief of symptoms'
    },
    'ferrous-sulfate': {
        name: 'Ferrous Sulfate',
        genericName: 'Ferrous Sulfate',
        brandName: 'Feosol',
        category: 'Iron Supplement',
        indication: 'Iron deficiency anemia',
        mechanism: 'Replaces iron stores needed for hemoglobin, myoglobin, and enzymes.',
        sideEffects: ['Constipation', 'Dark stools', 'Nausea', 'Abdominal pain'],
        contraindications: ['Hemochromatosis', 'Hemosiderosis'],
        dosing: '325 mg (65 mg elemental iron) 1-3 times daily',
        monitoring: 'Hgb, Ferritin, Reticulocyte count'
    },
    'vitamin-d3': {
        name: 'Cholecalciferol (Vitamin D3)',
        genericName: 'Vitamin D3',
        brandName: 'Vitamin D3',
        category: 'Vitamin',
        indication: 'Vitamin D deficiency, Osteoporosis prevention',
        mechanism: 'Increases intestinal calcium absorption.',
        sideEffects: ['Hypercalcemia (overdose)', 'Constipation'],
        contraindications: ['Hypercalcemia', 'Vitamin D toxicity'],
        dosing: '600-2000 units daily (higher for treatment)',
        monitoring: '25-OH Vitamin D levels, Calcium'
    },
    // SPECIALIZED HOSPITAL BATCH 9
    'linezolid': {
        name: 'Linezolid',
        genericName: 'Linezolid',
        brandName: 'Zyvox',
        category: 'Oxazolidinone Antibiotic',
        indication: 'VRE infections, MRSA pneumonia',
        mechanism: 'Inhibits bacterial protein synthesis by binding to the 50S ribosomal subunit.',
        sideEffects: ['Thrombocytopenia (long term)', 'Serotonin Syndrome (with SSRIs)', 'Optic/Peripheral neuropathy'],
        contraindications: ['Use within 14 days of MAOIs'],
        dosing: '600 mg IV/PO q12h',
        monitoring: 'CBC (weekly), Vision changes'
    },
    'meropenem': {
        name: 'Meropenem',
        genericName: 'Meropenem',
        brandName: 'Merrem',
        category: 'Carbapenem Antibiotic',
        indication: 'Intra-abdominal infections, Meningitis, Sepsis',
        mechanism: 'Inhibits bacterial cell wall synthesis.',
        sideEffects: ['Seizures (CNS risk)', 'Diarrhea', 'Rash'],
        contraindications: ['Anaphylactic reaction to beta-lactams'],
        dosing: '500 mg - 2 g IV q8h',
        monitoring: 'Renal function, Neurologic status'
    },
    'amphotericin-b': {
        name: 'Amphotericin B (Liposomal)',
        genericName: 'Amphotericin B',
        brandName: 'AmBisome',
        category: 'Antifungal',
        indication: 'Severe systemic fungal infections',
        mechanism: 'Binds to ergosterol in fungal cell membranes, creating pores.',
        sideEffects: ['Nephrotoxicity', 'Infusion reactions (fever, chills)', 'Hypokalemia', 'Hypomagnesemia'],
        contraindications: ['Hypersensitivity'],
        dosing: '3-5 mg/kg IV daily',
        monitoring: 'BUN/Creatinine, Electrolytes (K, Mg), CBC'
    },
    'midazolam': {
        name: 'Midazolam',
        genericName: 'Midazolam',
        brandName: 'Versed',
        category: 'Benzodiazepine',
        indication: 'Preoperative sedation, Procedural sedation, Status epilepticus',
        mechanism: 'Enhances GABA-A receptor activity.',
        sideEffects: ['Respiratory depression', 'Hypotension', 'Anterograde amnesia'],
        contraindications: ['Acute narrow-angle glaucoma', 'Shock'],
        dosing: '1-5 mg IV (procedural); 10 mg IM (seizure)',
        monitoring: 'RR, BP, O2 sat, Level of consciousness'
    },
    'dexmedetomidine': {
        name: 'Dexmedetomidine',
        genericName: 'Dexmedetomidine',
        brandName: 'Precedex',
        category: 'Alpha-2 Adrenergic Agonist (Sedative)',
        indication: 'ICU sedation, Procedural sedation',
        mechanism: 'Selective alpha-2 adrenoceptor agonist.',
        sideEffects: ['Bradycardia', 'Hypotension', 'Dry mouth'],
        contraindications: ['Hypersensitivity'],
        dosing: '0.2-1.5 mcg/kg/hr infusion',
        monitoring: 'HR, BP'
    },
    // CHRONIC SPECIALTY expansion BATCH 10
    'phenytoin': {
        name: 'Phenytoin',
        genericName: 'Phenytoin',
        brandName: 'Dilantin',
        category: 'Antiepileptic',
        indication: 'Seizures, Status epilepticus',
        mechanism: 'Stabilizes neuronal membranes by increasing efflux or decreasing influx of sodium ions.',
        sideEffects: ['Gingival hyperplasia', 'Nystagmus', 'Ataxia', 'Hirsutism', 'Rash (SJS)'],
        contraindications: ['Sinus bradycardia', 'AV block'],
        dosing: '300-400 mg daily (LD: 15-20 mg/kg)',
        monitoring: 'Serum levels (10-20 mcg/mL), LFTs, CBC, Skin'
    },
    'phenobarbital': {
        name: 'Phenobarbital',
        genericName: 'Phenobarbital',
        brandName: 'Luminal',
        category: 'Barbiturate / Antiepileptic',
        indication: 'Seizures, Sedation',
        mechanism: 'Increases GABA-mediated chloride influx.',
        sideEffects: ['Sedation', 'Cognitive impairment', 'Respiratory depression', 'Dependency'],
        contraindications: ['Severe hepatic impairment', 'Dyspnea or obstruction', 'Porphyria'],
        dosing: '30-120 mg daily',
        monitoring: 'Serum levels (15-40 mcg/mL), RR'
    },
    'baclofen': {
        name: 'Baclofen',
        genericName: 'Baclofen',
        brandName: 'Lioresal',
        category: 'Skeletal Muscle Relaxant',
        indication: 'Spasticity (MS, Spinal cord injury)',
        mechanism: 'Inhibits monosynaptic and polysynaptic reflexes at the spinal level (GABA-B agonist).',
        sideEffects: ['Drowsiness', 'Dizziness', 'Weakness', 'Hypotonia'],
        contraindications: ['Hypersensitivity'],
        dosing: '5 mg TID up to 20 mg qID',
        monitoring: 'Muscle tone, Mental status'
    },
    'pyridostigmine': {
        name: 'Pyridostigmine',
        genericName: 'Pyridostigmine',
        brandName: 'Mestinon',
        category: 'Acetylcholinesterase Inhibitor',
        indication: 'Myasthenia Gravis',
        mechanism: 'Inhibits destruction of acetylcholine by cholinesterase.',
        sideEffects: ['Abdominal cramps', 'Diarrhea', 'Increased salivation', 'Bradycardia'],
        contraindications: ['Mechanical GI or urinary obstruction'],
        dosing: '60 mg 3-6 times daily',
        monitoring: 'Muscle strength'
    },
    'thiamine': {
        name: 'Thiamine (Vitamin B1)',
        genericName: 'Vitamin B1',
        brandName: 'Thiamine',
        category: 'Vitamin',
        indication: 'Thiamine deficiency, Wernicke-Korsakoff syndrome',
        mechanism: 'Essential coenzyme for carbohydrate metabolism.',
        sideEffects: ['Anaphylaxis (rare with IV)', 'Nausea'],
        contraindications: ['Hypersensitivity'],
        dosing: '100-500 mg daily',
        monitoring: 'Neurologic status'
    },
    'folic-acid': {
        name: 'Folic Acid (Vitamin B9)',
        genericName: 'Folic Acid',
        brandName: 'Folic Acid',
        category: 'Vitamin',
        indication: 'Folate deficiency, Neural tube defect prevention',
        mechanism: 'Required for nucleoprotein synthesis and erythropoiesis.',
        sideEffects: ['Nausea', 'Bitter taste'],
        contraindications: ['Undiagnosed anemia (may mask B12 deficiency)'],
        dosing: '0.4 - 1 mg daily',
        monitoring: 'Hgb, Folate levels'
    },
    // PRIMARY CARE & SPECIALTY BATCH 11
    'allopurinol': {
        name: 'Allopurinol',
        genericName: 'Allopurinol',
        brandName: 'Zyloprim',
        category: 'Xanthine Oxidase Inhibitor',
        indication: 'Gout (chronic management), Tumor lysis syndrome',
        mechanism: 'Inhibits xanthine oxidase, reducing uric acid production.',
        sideEffects: ['Rash (can be severe - SJS)', 'Nausea', 'Hepatotoxicity', 'Leukopenia'],
        contraindications: ['Hypersensitivity'],
        dosing: '100-300 mg daily (adjust for renal function)',
        monitoring: 'Uric acid levels, CBC, LFTs, Skin assessment'
    },
    'colchicine': {
        name: 'Colchicine',
        genericName: 'Colchicine',
        brandName: 'Colcrys',
        category: 'Antigout Agent',
        indication: 'Acute gout flares, FMF',
        mechanism: 'Inhibits microtubule assembly in neutrophils, reducing inflammation.',
        sideEffects: ['Diarrhea (severe)', 'Nausea/Vomiting', 'Myelosuppression (toxic doses)', 'Myopathy'],
        contraindications: ['Severe renal/hepatic impairment with P-gp or CYP3A4 inhibitors'],
        dosing: '1.2 mg then 0.6 mg 1 hour later (acute flare)',
        monitoring: 'CBC, Renal function'
    },
    'tamsulosin': {
        name: 'Tamsulosin',
        genericName: 'Tamsulosin',
        brandName: 'Flomax',
        category: 'Alpha-1 Adrenergic Antagonist',
        indication: 'BPH (Benign Prostatic Hyperplasia), Kidney stones (expulsion)',
        mechanism: 'Selective alpha-1A antagonist in the prostate and bladder neck.',
        sideEffects: ['Orthostatic hypotension (first dose)', 'Dizziness', 'Retrograde ejaculation', 'IFIS (cataract surgery)'],
        contraindications: ['Hypersensitivity'],
        dosing: '0.4 mg daily (30 min after same meal each day)',
        monitoring: 'BP, Prostate symptoms'
    },
    'sildenafil': {
        name: 'Sildenafil',
        genericName: 'Sildenafil',
        brandName: 'Viagra, Revatio',
        category: 'PDE-5 Inhibitor',
        indication: 'Erectile Dysfunction, Pulmonary Hypertension (PAH)',
        mechanism: 'Inhibits PDE-5, increasing cGMP and causing smooth muscle relaxation.',
        sideEffects: ['Headache', 'Flushing', 'Dyspepsia', 'Blue-tinted vision', 'Priapism'],
        contraindications: ['Nitrate use (absolute)', 'Severe cardiac disease'],
        dosing: '25-100 mg PRN (ED); 20 mg TID (PAH)',
        monitoring: 'BP, HR, Erection duration'
    },
    'celecoxib': {
        name: 'Celecoxib',
        genericName: 'Celecoxib',
        brandName: 'Celebrex',
        category: 'NSAID (COX-2 Selective)',
        indication: 'Osteoarthritis, RA, Acute pain',
        mechanism: 'Selective COX-2 inhibitor.',
        sideEffects: ['GI upset (lower risk than non-selective)', 'Hypertension', 'CV risks (thrombotic events)', 'Renal toxicity'],
        contraindications: ['Sulfa allergy', 'CABG surgery', 'Active GI bleeding'],
        dosing: '100-200 mg daily or BID',
        monitoring: 'Renal function, BP'
    },
    'meloxicam': {
        name: 'Meloxicam',
        genericName: 'Meloxicam',
        brandName: 'Mobic',
        category: 'NSAID',
        indication: 'Osteoarthritis, RA',
        mechanism: 'Preferential COX-2 inhibitor.',
        sideEffects: ['GI upset', 'Dizziness', 'Renal impairment', 'Edema'],
        contraindications: ['Active peptic ulcer', 'CABG surgery'],
        dosing: '7.5-15 mg once daily',
        monitoring: 'BP, Renal function, CBC'
    },
    'latanoprost': {
        name: 'Latanoprost',
        genericName: 'Latanoprost',
        brandName: 'Xalatan',
        category: 'Prostaglandin Analog (Ophthalmic)',
        indication: 'Glaucoma, Ocular hypertension',
        mechanism: 'Increases aqueous humor outflow.',
        sideEffects: ['Iris pigmentation (permanent)', 'Eyelash growth', 'Blurred vision', 'Redness'],
        contraindications: ['Hypersensitivity'],
        dosing: '1 drop in affected eye(s) daily at evening',
        monitoring: 'Intraocular pressure'
    },
    'mupirocin': {
        name: 'Mupirocin (Topical)',
        genericName: 'Mupirocin',
        brandName: 'Bactroban',
        category: 'Topical Antibiotic',
        indication: 'Impetigo, Skin infections, MRSA colonization (nasal)',
        mechanism: 'Inhibits bacterial protein synthesis by binding to isoleucyl-tRNA synthetase.',
        sideEffects: ['Local irritation', 'Burning', 'Stinging'],
        contraindications: ['Hypersensitivity'],
        dosing: 'Apply to affected area TID',
        monitoring: 'Resolution of infection'
    },
    'cyanocobalamin': {
        name: 'Cyanocobalamin (Vitamin B12)',
        genericName: 'Vitamin B12',
        brandName: 'Vitamin B12',
        category: 'Vitamin',
        indication: 'B12 deficiency, Pernicious anemia',
        mechanism: 'Essential for DNA synthesis and neurologic function.',
        sideEffects: ['Hyperuricemia (rare)', 'Itching', 'Diarrhea'],
        contraindications: ['Hypersensitivity'],
        dosing: '1000 mcg daily (oral); 1000 mcg monthly (IM)',
        monitoring: 'Serum B12, Hgb, Reticulocyte count'
    },
    // PRIMARY CARE & OTC FINAL BATCH 12
    'famotidine': {
        name: 'Famotidine',
        genericName: 'Famotidine',
        brandName: 'Pepcid',
        category: 'H2 Receptor Antagonist',
        indication: 'GERD, Peptic Ulcer Disease, Heartburn',
        mechanism: 'Competitive inhibition of H2 receptors on gastric parietal cells.',
        sideEffects: ['Headache', 'Dizziness', 'Constipation', 'Diarrhea'],
        contraindications: ['Hypersensitivity'],
        dosing: '20 mg BID or 40 mg daily',
        monitoring: 'Renal function (adjust dose if CrCl <50)'
    },
    'guaifenesin': {
        name: 'Guaifenesin',
        genericName: 'Guaifenesin',
        brandName: 'Mucinex, Robitussin',
        category: 'Expectorant',
        indication: 'Cough (productive)',
        mechanism: 'Reduces viscosity of secretions by increasing respiratory tract fluid.',
        sideEffects: ['Nausea', 'Vomiting', 'Dizziness', 'Headache'],
        contraindications: ['Hypersensitivity'],
        dosing: '600-1200 mg q12h (Extended release); 200-400 mg q4h (Immediate release)',
        monitoring: 'Hydration status'
    },
    'pseudoephedrine': {
        name: 'Pseudoephedrine',
        genericName: 'Pseudoephedrine',
        brandName: 'Sudafed',
        category: 'Decongestant (Alpha/Beta Agonist)',
        indication: 'Nasal/Sinus congestion',
        mechanism: 'Stimulates alpha-adrenergic receptors, causing vasoconstriction of nasal mucosa.',
        sideEffects: ['Insomnia', 'Tachycardia', 'Palpitations', 'Hypertension', 'Restlessness'],
        contraindications: ['MAOI use within 14 days', 'Severe hypertension/CAD', 'Narrow-angle glaucoma'],
        dosing: '60 mg q4-6h or 120-240 mg daily (Extended release)',
        monitoring: 'BP, HR'
    },
    'cyclobenzaprine': {
        name: 'Cyclobenzaprine',
        genericName: 'Cyclobenzaprine',
        brandName: 'Flexeril',
        category: 'Skeletal Muscle Relaxant',
        indication: 'Muscle spasm (short-term)',
        mechanism: 'Reduces tonic somatic motor activity at the brainstem.',
        sideEffects: ['Xerostomia (very common)', 'Drowsiness', 'Dizziness', 'Confusion'],
        contraindications: ['MAOI use', 'Acute recovery phase of MI', 'Arrythmias', 'Heart failure'],
        dosing: '5-10 mg TID PRN',
        monitoring: 'Mental status, Fall risk'
    },
    'tizanidine': {
        name: 'Tizanidine',
        genericName: 'Tizanidine',
        brandName: 'Zanaflex',
        category: 'Alpha-2 Adrenergic Agonist (Muscle Relaxant)',
        indication: 'Muscle spasticity',
        mechanism: 'Increases presynaptic inhibition of motor neurons.',
        sideEffects: ['Hypotension', 'Xerostomia', 'Somnolence', 'Hepatotoxicity'],
        contraindications: ['Ciprofloxacin use (strong CYP1A2 inhibitor)', 'Fluvoxamine use'],
        dosing: '2-4 mg q6-8h (Initial)',
        monitoring: 'BP, LFTs'
    },
    'methocarbamol': {
        name: 'Methocarbamol',
        genericName: 'Methocarbamol',
        brandName: 'Robaxin',
        category: 'Skeletal Muscle Relaxant',
        indication: 'Muscle spasm',
        mechanism: 'General CNS depression (not direct muscle relaxation).',
        sideEffects: ['Drowsiness', 'Dizziness', 'Discolored urine (green/black)'],
        contraindications: ['Hypersensitivity'],
        dosing: '500-1500 mg TID/QID',
        monitoring: 'Mental status'
    },
    'melatonin': {
        name: 'Melatonin',
        genericName: 'Melatonin',
        brandName: 'Melatonin',
        category: 'Hormone / Supplement',
        indication: 'Sleep disorders, Jet lag',
        mechanism: 'Agonist at melatonin receptors (MT1, MT2) in the suprachiasmatic nucleus.',
        sideEffects: ['Drowsiness', 'Vivid dreams', 'Headache'],
        contraindications: ['Hypersensitivity'],
        dosing: '1-10 mg 30-60 min before bedtime',
        monitoring: 'Sleep quality'
    },
    'capsaicin': {
        name: 'Capsaicin (Topical)',
        genericName: 'Capsaicin',
        brandName: 'Zostrix',
        category: 'Topical Analgesic',
        indication: 'Arthritis pain, Postherpetic neuralgia',
        mechanism: 'Depletes and prevents reaccumulation of Substance P in peripheral sensory neurons.',
        sideEffects: ['Burning', 'Stinging', 'Erythema', 'Cough (if inhaled)'],
        contraindications: ['Hypersensitivity'],
        dosing: 'Apply to affected area 3-4 times daily',
        monitoring: 'Pain relief, Skin integrity'
    },
    'bacitracin': {
        name: 'Bacitracin (Topical)',
        genericName: 'Bacitracin',
        brandName: 'Bacitracin',
        category: 'Topical Antibiotic',
        indication: 'Skin infection prevention (minor cuts/burns)',
        mechanism: 'Inhibits bacterial cell wall synthesis.',
        sideEffects: ['Contact dermatitis', 'Rash'],
        contraindications: ['Hypersensitivity'],
        dosing: 'Apply to affected area 1-3 times daily',
        monitoring: 'Signs of infection'
    },
    'bismuth-subsalicylate': {
        name: 'Bismuth Subsalicylate',
        genericName: 'Bismuth Subsalicylate',
        brandName: 'Pepto-Bismol',
        category: 'Antidiarrheal / Antacid',
        indication: 'Diarrhea, Dyspepsia, H. pylori (adjunct)',
        mechanism: 'Antisecretory and antimicrobial effects; salicylate provides anti-inflammatory effect.',
        sideEffects: ['Black tongue/stools', 'Tinnitus (high doses)', 'Constipation'],
        contraindications: ['Children with viral infections (Reye syndrome)', 'Salicylate allergy', 'Active bleeding'],
        dosing: '524 mg q30-60min PRN (Max 8 doses/day)',
        monitoring: 'Stool consistency'
    },
    // FINAL MILESTONE BATCH (PRIMARY CARE & OTC)
    'senna': {
        name: 'Senna',
        genericName: 'Sennosides',
        brandName: 'Senokot',
        category: 'Stimulant Laxative',
        indication: 'Constipation',
        mechanism: 'Direct action on intestinal mucosa; increases peristalsis.',
        sideEffects: ['Abdominal cramps', 'Melanosis coli (long term)', 'Discolored urine (red-brown)'],
        contraindications: ['Bowel obstruction', 'Acute inflammatory bowel disease'],
        dosing: '8.6-17.2 mg daily (at bedtime)',
        monitoring: 'Bowel frequency'
    },
    'docusate': {
        name: 'Docusate Sodium',
        genericName: 'Docusate',
        brandName: 'Colace',
        category: 'Stool Softener (Surfactant)',
        indication: 'Constipation (prevention)',
        mechanism: 'Reduces surface tension of the oil-water interface of the stool.',
        sideEffects: ['Abdominal cramps', 'Bitter taste'],
        contraindications: ['Intestinal obstruction', 'Concomitant use of mineral oil'],
        dosing: '50-300 mg daily',
        monitoring: 'Stool consistency'
    },
    'bisacodyl': {
        name: 'Bisacodyl',
        genericName: 'Bisacodyl',
        brandName: 'Dulcolax',
        category: 'Stimulant Laxative',
        indication: 'Constipation, Bowel prep',
        mechanism: 'Stimulates enteric nerves to cause peristalsis.',
        sideEffects: ['Severe abdominal cramps', 'Nausea', 'Electrolyte imbalance (long term)'],
        contraindications: ['Appendicitis', 'Intestinal obstruction', 'Ileus'],
        dosing: '5-15 mg daily (oral) or 10 mg (rectal)',
        monitoring: 'Stool frequency'
    },
    'calcium-carbonate': {
        name: 'Calcium Carbonate',
        genericName: 'Calcium Carbonate',
        brandName: 'Tums, Os-Cal',
        category: 'Antacid / Calcium Supplement',
        indication: 'Heartburn, Indigestion, Osteoporosis prevention',
        mechanism: 'Neutralizes gastric acid; replenishes calcium stores.',
        sideEffects: ['Constipation', 'Hypercalcemia', 'Milk-alkali syndrome (high doses)'],
        contraindications: ['Hypercalcemia', 'Renal calculi (history)'],
        dosing: '500-1000 mg PRN (antacid); 1000-1200 mg daily (supplement)',
        monitoring: 'Serum Calcium, Renal function'
    },
    'clobetasol': {
        name: 'Clobetasol Propionate (Topical)',
        genericName: 'Clobetasol',
        brandName: 'Temovate',
        category: 'Corticosteroid (Very High Potency)',
        indication: 'Psoriasis, Severe dermatitis',
        mechanism: 'Potent anti-inflammatory and antiproliferic effects.',
        sideEffects: ['Skin atrophy', 'Striae', 'HPA axis suppression (long term/large areas)'],
        contraindications: ['Viral skin infections', 'Acne vulgaris'],
        dosing: 'Apply to affected area BID (Max 50g/week; Max 2 weeks)',
        monitoring: 'Skin integrity'
    },
    'mometasone-nasal': {
        name: 'Mometasone (Nasal)',
        genericName: 'Mometasone Furoate',
        brandName: 'Nasonex',
        category: 'Corticosteroid (Nasal)',
        indication: 'Allergic rhinitis, Nasal polyps',
        mechanism: 'Inhibits inflammatory cells and mediator release in the nasal mucosa.',
        sideEffects: ['Epistaxis', 'Headache', 'Nasal irritation'],
        contraindications: ['Recent nasal surgery or trauma'],
        dosing: '2 sprays in each nostril daily',
        monitoring: 'Nasal septum exam'
    },
    'artificial-tears': {
        name: 'Artificial Tears',
        genericName: 'Carboxymethylcellulose / Hypromellose',
        brandName: 'Refresh, Systane',
        category: 'Ophthalmic Lubricant',
        indication: 'Dry eye symptoms, Ocular irritation',
        mechanism: 'Lubricates the ocular surface.',
        sideEffects: ['Blurred vision (transient)', 'Eye redness'],
        contraindications: ['Hypersensitivity'],
        dosing: '1-2 drops as needed',
        monitoring: 'Symptom relief'
    },
    'ascorbic-acid': {
        name: 'Ascorbic Acid (Vitamin C)',
        genericName: 'Vitamin C',
        brandName: 'Vitamin C',
        category: 'Vitamin',
        indication: 'Vitamin C deficiency (Scurvy), Nutritional supplement',
        mechanism: 'Essential for collagen synthesis and tissue repair.',
        sideEffects: ['Nausea', 'Diarrhea (high doses)', 'Oxalate kidney stones'],
        contraindications: ['Hyperoxaluria'],
        dosing: '50-1000 mg daily',
        monitoring: 'Renal function (high doses)'
    },
    'niacin': {
        name: 'Niacin (Vitamin B3)',
        genericName: 'Nicotinic Acid',
        brandName: 'Niaspan',
        category: 'Vitamin / Antilipemic',
        indication: 'Dyslipidemia, Niacin deficiency (Pellagra)',
        mechanism: 'Inhibits lipolysis; reduces LDL and increases HDL.',
        sideEffects: ['Flushing (very common)', 'Pruritus', 'Hepatotoxicity (XR)', 'Hyperglycemia', 'Gout exacerbation'],
        contraindications: ['Active peptic ulcer', 'Active liver disease', 'Arterial bleeding'],
        dosing: '500-2000 mg daily (at bedtime with low-fat snack)',
        monitoring: 'LFTs, Lipid panel, Glucose, Uric acid'
    },
    'glucosamine': {
        name: 'Glucosamine Sulfate',
        genericName: 'Glucosamine',
        brandName: 'Glucosamine',
        category: 'Supplement',
        indication: 'Osteoarthritis pain',
        mechanism: 'Precursor for glycosaminoglycans in joint cartilage.',
        sideEffects: ['GI upset', 'Heartburn'],
        contraindications: ['Shellfish allergy'],
        dosing: '500 mg TID or 1500 mg daily',
        monitoring: 'Joint pain'
    },
    'magnesium-oxide': {
        name: 'Magnesium Oxide',
        genericName: 'Magnesium Oxide',
        brandName: 'Mag-Ox',
        category: 'Mineral Supplement',
        indication: 'Magnesium deficiency, Hypomagnesemia',
        mechanism: 'Essential cofactor for enzymatic reactions; regulates muscle and nerve function.',
        sideEffects: ['Diarrhea', 'Abdominal cramping'],
        contraindications: ['Severe renal impairment (CrCl < 30)', 'Heart block'],
        dosing: '400-800 mg daily',
        monitoring: 'Serum magnesium, Renal function'
    },
    'potassium-chloride': {
        name: 'Potassium Chloride',
        genericName: 'Potassium Chloride',
        brandName: 'K-Dur, Klor-Con',
        category: 'Electrolyte',
        indication: 'Hypokalemia',
        mechanism: 'Primary intracellular cation essential for nerve conduction and muscle contraction.',
        sideEffects: ['Nausea', 'Abdominal pain', 'Hyperkalemia (overdose)'],
        contraindications: ['Hyperkalemia', 'Severe renal failure', 'Addison disease'],
        dosing: '20-40 mEq daily (prevention); 40-100 mEq daily (treatment)',
        monitoring: 'Serum potassium, Renal function, ECG (if IV)'
    },
    'zinc-sulfate': {
        name: 'Zinc Sulfate',
        genericName: 'Zinc',
        brandName: 'Zinc Sulfate',
        category: 'Mineral Supplement',
        indication: 'Zinc deficiency, Wound healing (adjunct)',
        mechanism: 'Cofactor for over 70 enzymes; essential for protein synthesis and immune function.',
        sideEffects: ['Nausea/Vomiting (especially on empty stomach)', 'Copper deficiency (long term high doses)'],
        contraindications: ['Hypersensitivity'],
        dosing: '11-50 mg daily',
        monitoring: 'Zinc levels (chronic use)'
    },
    'vitamin-a': {
        name: 'Retinol (Vitamin A)',
        genericName: 'Vitamin A',
        brandName: 'Vitamin A',
        category: 'Vitamin',
        indication: 'Vitamin A deficiency, Nutritional supplement',
        mechanism: 'Essential for vision, cellular differentiation, and immune function.',
        sideEffects: ['Hypervitaminosis A (toxicity)', 'Teratogenicity (high doses in pregnancy)'],
        contraindications: ['Pregnancy (excessive doses)', 'Hypervitaminosis A'],
        dosing: '700-900 mcg (2300-3000 IU) daily',
        monitoring: 'Signs of toxicity (dry skin, headache, hepatomegaly)'
    },
    'phytonadione': {
        name: 'Phytonadione (Vitamin K1)',
        genericName: 'Vitamin K1',
        brandName: 'Mephyton',
        category: 'Vitamin / Antidote',
        indication: 'Warfarin reversal, Vitamin K deficiency',
        mechanism: 'Promotes liver synthesis of clotting factors II, VII, IX, and X.',
        sideEffects: ['Anaphylaxis (with IV injection)', 'Flushing', 'Taste changes'],
        contraindications: ['Hypersensitivity'],
        dosing: '1-10 mg PO/IV (Warfarin reversal)',
        monitoring: 'PT/INR'
    },
    'pyridoxine': {
        name: 'Pyridoxine (Vitamin B6)',
        genericName: 'Vitamin B6',
        brandName: 'Vitamin B6',
        category: 'Vitamin',
        indication: 'B6 deficiency, Sideroblastic anemia, Peripheral neuropathy (with Isoniazid)',
        mechanism: 'Cofactor for amino acid, carbohydrate, and lipid metabolism.',
        sideEffects: ['Neuropathy (extreme high doses long term)'],
        contraindications: ['Hypersensitivity'],
        dosing: '25-100 mg daily',
        monitoring: 'Neurologic status'
    },
    'riboflavin': {
        name: 'Riboflavin (Vitamin B2)',
        genericName: 'Vitamin B2',
        brandName: 'Vitamin B2',
        category: 'Vitamin',
        indication: 'Riboflavin deficiency, Migraine prophylaxis (adjunct)',
        mechanism: 'Essential for oxidative-reduction reactions and ATP production.',
        sideEffects: ['Yellow-orange discolored urine (harmless)'],
        contraindications: ['Hypersensitivity'],
        dosing: '1.3 mg daily (nutritional); 400 mg daily (migraine)',
        monitoring: 'Migraine frequency'
    },
    'biotin': {
        name: 'Biotin (Vitamin B7)',
        genericName: 'Biotin',
        brandName: 'Biotin',
        category: 'Vitamin',
        indication: 'Biotin deficiency, Hair/Skin/Nail health (adjunct)',
        mechanism: 'Cofactor for carboxylase enzymes involved in fatty acid and gluconeogenesis.',
        sideEffects: ['Interference with lab tests (Troponin, Thyroid)'],
        contraindications: ['Hypersensitivity'],
        dosing: '30-100 mcg daily',
        monitoring: 'Clinical symptoms'
    },
    // BATCH 1: SPECIALTY CARDIOLOGY & NEPHROLOGY
    'eplerenone': {
        name: 'Eplerenone',
        genericName: 'Eplerenone',
        brandName: 'Inspra',
        category: 'Aldosterone Antagonist',
        indication: 'Heart Failure post-MI, Hypertension',
        mechanism: 'Selective blockade of mineralocorticoid receptors.',
        sideEffects: ['Hyperkalemia', 'Increased creatinine', 'Dizziness'],
        contraindications: ['Serum K > 5.5', 'CrCl < 30', 'Concomitant use of strong CYP3A4 inhibitors'],
        dosing: '25-50 mg daily',
        monitoring: 'Serum K, Renal function'
    },
    'telmisartan': {
        name: 'Telmisartan',
        genericName: 'Telmisartan',
        brandName: 'Micardis',
        category: 'ARB',
        indication: 'Hypertension, CV risk reduction',
        mechanism: 'Angiotensin II receptor antagonist.',
        sideEffects: ['Dizziness', 'Upper respiratory infection', 'Back pain', 'Hyperkalemia'],
        contraindications: ['Pregnancy', 'Bilateral renal artery stenosis'],
        dosing: '40-80 mg daily',
        monitoring: 'BP, K+, Renal function'
    },
    'sacubitril-valsartan': {
        name: 'Sacubitril-Valsartan',
        genericName: 'Sacubitril/Valsartan',
        brandName: 'Entresto',
        category: 'ARNI',
        indication: 'HFrEF, HFpEF',
        mechanism: 'Neprilysin inhibition (sacubitril) + ARB (valsartan).',
        sideEffects: ['Hypotension', 'Hyperkalemia', 'Angioedema', 'Renal impairment'],
        contraindications: ['History of ACEi/ARB angioedema', 'Concomitant ACE inhibitor', 'Pregnancy'],
        dosing: '24/26 mg to 97/103 mg BID',
        monitoring: 'BP, K+, Renal function'
    },
    'dapagliflozin': {
        name: 'Dapagliflozin',
        genericName: 'Dapagliflozin',
        brandName: 'Farxiga',
        category: 'SGLT2 Inhibitor',
        indication: 'T2DM, HFrEF, CKD',
        mechanism: 'Inhibits SGLT2 in proximal tubule, promoting glycosuria.',
        sideEffects: ['UTI', 'Genital mycotic infections', 'Necrotizing fasciitis of perineum', 'Hypovolemia'],
        contraindications: ['Hypersensitivity', 'Dialysis'],
        dosing: '5-10 mg daily',
        monitoring: 'Renal function, BP, volume status'
    },
    'rivaroxaban': {
        name: 'Rivaroxaban',
        genericName: 'Rivaroxaban',
        brandName: 'Xarelto',
        category: 'DOAC',
        indication: 'AFib (non-valvular), DVT/PE treatment and prophylaxis',
        mechanism: 'Factor Xa inhibitor.',
        sideEffects: ['Bleeding', 'Hematoma', 'Back pain'],
        contraindications: ['Active pathological bleeding', 'Severe renal impairment (varies by indication)'],
        dosing: '10-20 mg daily with food (usually)',
        monitoring: 'Renal function, CBC, signs of bleeding'
    },
    'felodipine': {
        name: 'Felodipine',
        genericName: 'Felodipine',
        brandName: 'Plendil',
        category: 'Calcium Channel Blocker (Dihydropyridine)',
        indication: 'Hypertension',
        mechanism: 'Vasodilation via blockade of L-type calcium channels.',
        sideEffects: ['Peripheral edema', 'Headache', 'Flushing', 'Gingival hyperplasia'],
        contraindications: ['Hypersensitivity'],
        dosing: '2.5-10 mg daily',
        monitoring: 'BP, HR, Edema'
    },
    // BATCH 2: ONCOLOGY & ADVANCED IMMUNOLOGY (Specialty Additions)
    'rituximab': {
        name: 'Rituximab',
        genericName: 'Rituximab',
        brandName: 'Rituxan',
        category: 'Antineoplastic Agent, Anti-CD20 Monoclonal Antibody',
        indication: 'Non-Hodgkin Lymphoma, CLL, Rheumatoid Arthritis',
        mechanism: 'Binds to CD20 on B-lymphocytes, mediating cell lysis.',
        sideEffects: ['Infusion reactions (severe)', 'B-cell depletion', 'PML (rare)', 'HBV reactivation'],
        contraindications: ['Active, severe infection'],
        dosing: '375 mg/m2 IV weekly (Lymphoma) or 1000mg x 2 (RA)',
        monitoring: 'CBC, Vital signs during infusion, HBV screen'
    },
    'mycophenolate': {
        name: 'Mycophenolate Mofetil',
        genericName: 'Mycophenolate',
        brandName: 'CellCept',
        category: 'Immunosuppressant',
        indication: 'Organ transplant rejection prophylaxis',
        mechanism: 'Inhibits inosine monophosphate dehydrogenase (IMPDH), limiting B/T cell proliferation.',
        sideEffects: ['GI upset (diarrhea)', 'Leukopenia', 'Anemia', 'Teratogenicity (REM)'],
        contraindications: ['Pregnancy (Black Box)', 'Hypersensitivity'],
        dosing: '1000-1500 mg BID',
        monitoring: 'CBC, Pregnancy tests (monthly)'
    },
    // BATCH 3: ENDOCRINE & METABOLIC DISORDERS
    'pioglitazone': {
        name: 'Pioglitazone',
        genericName: 'Pioglitazone',
        brandName: 'Actos',
        category: 'Thiazolidinedione (TZD)',
        indication: 'Type 2 Diabetes',
        mechanism: 'PPAR-gamma agonist; increases peripheral insulin sensitivity.',
        sideEffects: ['Edema', 'Weight gain', 'Heart failure risk', 'Bladder cancer risk (long term)'],
        contraindications: ['NYHA Class III/IV Heart Failure'],
        dosing: '15-45 mg daily',
        monitoring: 'Signs of heart failure, LFTs'
    },
    'canagliflozin': {
        name: 'Canagliflozin',
        genericName: 'Canagliflozin',
        brandName: 'Invokana',
        category: 'SGLT2 Inhibitor',
        indication: 'T2DM, CV risk reduction, CKD',
        mechanism: 'Inhibits SGLT2 in the kidney, reducing glucose reabsorption.',
        sideEffects: ['UTI', 'Genital mycotic infections', 'Increased urination', 'Bone fractures (risk)', 'Amputation risk'],
        contraindications: ['Severe renal impairment (varies)'],
        dosing: '100-300 mg daily',
        monitoring: 'Renal function, K+, volume status'
    },
    'liraglutide': {
        name: 'Liraglutide',
        genericName: 'Liraglutide',
        brandName: 'Victoza, Saxenda',
        category: 'GLP-1 Receptor Agonist',
        indication: 'T2DM (Victoza), Chronic Weight Management (Saxenda)',
        mechanism: 'Incretin mimetic; slows gastric emptying and increases insulin secretion.',
        sideEffects: ['Nausea', 'Vomiting', 'Pancreatitis', 'Gallbladder disease'],
        contraindications: ['History of medullary thyroid carcinoma or MEN 2'],
        dosing: '0.6-1.8 mg SC daily (Victoza); up to 3 mg SC daily (Saxenda)',
        monitoring: 'A1C, Weight, GI symptoms'
    }
};

// COMPREHENSIVE INTERACTION MAP
export const INTERACTION_DATABASE: DrugInteraction[] = [
    // ... (rest of the file)

    // WARFARIN INTERACTIONS
    ...createInteraction('warfarin', 'aspirin', 'major', 'Increased bleeding risk.', 'Additive antiplatelet/anticoagulant effect.', 'Monitor INR closely; assess need for aspirin.'),
    ...createInteraction('warfarin', 'ibuprofen', 'major', 'Risk of severe GI bleeding.', 'NSAID-induced mucosal damage + anticoagulation.', 'Avoid combination if possible.'),
    ...createInteraction('warfarin', 'naproxen', 'major', 'Risk of severe GI bleeding.', 'NSAID-induced mucosal damage + anticoagulation.', 'Avoid combination.'),
    ...createInteraction('warfarin', 'amoxicillin', 'moderate', 'May increase INR.', 'Alteration of gut flora affecting Vitamin K.', 'Monitor INR; adjust dose if needed.'),
    ...createInteraction('warfarin', 'ciprofloxacin', 'major', 'Significantly increases INR.', 'CYP1A2/3A4 inhibition reduces warfarin metabolism.', 'Reduce warfarin dose; monitor INR closely.'),
    ...createInteraction('warfarin', 'levofloxacin', 'major', 'Significantly increases INR.', 'CYP inhibition/Gut flora changes.', 'Monitor INR closely.'),
    ...createInteraction('warfarin', 'metronidazole', 'major', 'Significantly increases INR.', 'Inhibits CYP2C9 metabolism of warfarin.', 'Avoid or reduce warfarin by 50%.'),
    ...createInteraction('warfarin', 'acetaminophen', 'moderate', 'May increase INR (high doses).', 'Metabolic interaction (minor pathway).', 'Monitor INR with chronic high-dose use.'),
    ...createInteraction('warfarin', 'clarithromycin', 'major', 'Significantly increases INR.', 'CYP3A4 inhibition.', 'Monitor INR closely.'),

    // ACE/ARB + K-SPARES/NSAIDs
    ...createInteraction('lisinopril', 'spironolactone', 'major', 'Risk of severe hyperkalemia.', 'Additive potassium retention.', 'Monitor K+ frequently; avoid in renal failure.'),
    ...createInteraction('losartan', 'spironolactone', 'major', 'Risk of severe hyperkalemia.', 'Additive potassium retention.', 'Monitor K+ frequently.'),
    ...createInteraction('valsartan', 'spironolactone', 'major', 'Risk of severe hyperkalemia.', 'Additive potassium retention.', 'Monitor K+ frequently.'),
    ...createInteraction('lisinopril', 'ibuprofen', 'moderate', 'Reduced antihypertensive effect; Renal risk.', 'NSAIDs constrict afferent arteriole; ACEi dilate efferent.', 'Monitor BP and Creatinine.'),
    ...createInteraction('lisinopril', 'naproxen', 'moderate', 'Reduced antihypertensive effect; Renal risk.', 'NSAIDs constrict afferent arteriole; ACEi dilate efferent.', 'Monitor BP and Creatinine.'),
    ...createInteraction('losartan', 'ibuprofen', 'moderate', 'Reduced effect; Renal risk.', 'Additive renal hemodynamic changes.', 'Monitor renal function.'),

    // SEROTONIN SYNDROME
    ...createInteraction('sertraline', 'tramadol', 'major', 'Risk of Serotonin Syndrome.', 'Additive serotonergic effects.', 'Monitor for agitation, tremor, hyperthermia.'),
    ...createInteraction('fluoxetine', 'tramadol', 'major', 'Risk of Serotonin Syndrome.', 'Additive serotonergic effects.', 'Monitor closely.'),
    ...createInteraction('venlafaxine', 'tramadol', 'major', 'Risk of Serotonin Syndrome.', 'Additive serotonergic effects.', 'Avoid combination.'),
    ...createInteraction('sertraline', 'venlafaxine', 'major', 'Risk of Serotonin Syndrome.', 'Duplicate serotonergic mechanism.', 'Avoid duplication.'),

    // QT PROLONGATION
    ...createInteraction('ciprofloxacin', 'azithromycin', 'moderate', 'Risk of QT prolongation.', 'Additive effect on cardiac repolarization.', 'Monitor ECG; avoid in high-risk pts.'),
    ...createInteraction('levofloxacin', 'azithromycin', 'moderate', 'Risk of QT prolongation.', 'Additive effect.', 'Monitor ECG.'),
    ...createInteraction('ciprofloxacin', 'ondansetron', 'moderate', 'Risk of QT prolongation.', 'Additive effect.', 'Monitor ECG.'),
    ...createInteraction('azithromycin', 'ondansetron', 'moderate', 'Risk of QT prolongation.', 'Additive effect.', 'Monitor ECG.'),

    // STATINS
    ...createInteraction('atorvastatin', 'clarithromycin', 'major', 'Risk of Rhabdomyolysis.', 'CYP3A4 inhibition increases statin levels.', 'Hold statin during antibiotic course.'),
    ...createInteraction('simvastatin', 'amlodipine', 'moderate', 'Increased risk of myopathy.', 'CYP3A4 interaction.', 'Max simvastatin dose 20mg with amlodipine.'),
    ...createInteraction('atorvastatin', 'diltiazem', 'moderate', 'Increased statin levels.', 'CYP3A4 inhibition.', 'Monitor for muscle pain.'),

    // CNS DEPRESSANTS
    ...createInteraction('alprazolam', 'tramadol', 'major', 'Risk of profound sedation/respiratory depression.', 'Additive CNS depression.', 'Avoid combination or minimize dose.'),
    ...createInteraction('alprazolam', 'alcohol', 'major', 'Risk of fatal respiratory depression.', 'Additive CNS depression.', 'Avoid alcohol.'),
    ...createInteraction('gabapentin', 'alprazolam', 'major', 'Severe CNS depression risk.', 'Potentiation of sedative effects.', 'Monitor closely; reduce doses.'),
    ...createInteraction('pregabalin', 'alprazolam', 'major', 'Severe CNS depression risk.', 'Potentiation of sedative effects.', 'Monitor closely.'),

    // OTHERS
    ...createInteraction('metformin', 'furosemide', 'moderate', 'Increased metformin levels; Fluid risk.', 'Competition for renal tubular secretion.', 'Monitor glucose and renal function.'),
    ...createInteraction('levothyroxine', 'omeprazole', 'moderate', 'Reduced thyroid absorption.', 'Gastric pH changes affect levothyroxine solubility.', 'Separate dosing by 4 hours.'),
    ...createInteraction('levothyroxine', 'pantoprazole', 'moderate', 'Reduced thyroid absorption.', 'Gastric pH changes.', 'Separate dosing.'),
    ...createInteraction('ciprofloxacin', 'prednisone', 'moderate', 'Increased risk of tendon rupture.', 'Synergistic collagen degradation.', 'Monitor for tendon pain/swelling.'),
    ...createInteraction('digoxin', 'verapamil', 'major', 'Digoxin toxicity risk.', 'Inhibition of P-glycoprotein efflux transport.', 'Reduce digoxin dose by 50%; monitor levels.'),

    // AMIODARONE INTERACTIONS
    ...createInteraction('amiodarone', 'warfarin', 'major', 'Extreme increase in INR and bleeding risk.', 'Inhibits CYP2C9, 2C19, 3A4, and P-gp.', 'Reduce warfarin dose by 33-50%; monitor INR weekly.'),
    ...createInteraction('amiodarone', 'digoxin', 'major', 'Digoxin toxicity risk.', 'Inhibition of P-gp efflux of digoxin.', 'Reduce digoxin dose by 50%; monitor levels.'),
    ...createInteraction('amiodarone', 'simvastatin', 'major', 'Risk of rhabdomyolysis.', 'Inhibits CYP3A4-mediated metabolism of simvastatin.', 'Do not exceed simvastatin 20mg daily.'),

    // AZOLE ANTIFUNGAL INTERACTIONS
    ...createInteraction('fluconazole', 'warfarin', 'major', 'Increased bleeding risk.', 'Inhibits CYP2C9 metabolism of warfarin.', 'Monitor INR closely; expect dose reduction.'),
    ...createInteraction('fluconazole', 'atorvastatin', 'moderate', 'Increased risk of myopathy.', 'CYP3A4 inhibition.', 'Monitor for muscle pain.'),
    ...createInteraction('fluconazole', 'simvastatin', 'major', 'High risk of rhabdomyolysis.', 'Potent CYP3A4 inhibition.', 'Avoid combination; hold statin.'),

    // DIABETES + BP MEDS
    ...createInteraction('canagliflozin', 'lisinopril', 'moderate', 'Risk of hyperkalemia and hypotension.', 'Synergistic effect on renal hemodynamics and K+.', 'Monitor BP and potassium.'),
    ...createInteraction('canagliflozin', 'losartan', 'moderate', 'Risk of hyperkalemia.', 'Additive K+ retention.', 'Monitor potassium.'),

    // MISC CRITICAL
    ...createInteraction('nitroglycerin', 'sildenafil', 'major', 'FATAL hypotension risk.', 'Synergistic increase in cGMP via nitric oxide/PDE-5 pathways.', 'ABSOLUTE CONTRAINDICATION. Separate by 24-48 hours.'),
    ...createInteraction('vancomycin', 'furosemide', 'moderate', 'Increased nephrotoxicity risk.', 'Additive renal stress.', 'Monitor SCr and urine output.'),

    // LITHIUM INTERACTIONS
    ...createInteraction('lithium', 'lisinopril', 'major', 'Severe lithium toxicity risk.', 'ACE inhibitors reduce lithium clearance.', 'Avoid or reduce lithium dose; monitor levels.'),
    ...createInteraction('lithium', 'losartan', 'major', 'Lithium toxicity risk.', 'ARBs reduce lithium clearance.', 'Monitor lithium levels closely.'),
    ...createInteraction('lithium', 'hydrochlorothiazide', 'major', 'Severe lithium toxicity risk.', 'Thiazides increase proximal tubule reabsorption of lithium.', 'Avoid or reduce lithium by 50%; monitor.'),
    ...createInteraction('lithium', 'ibuprofen', 'major', 'Lithium toxicity risk.', 'NSAIDs reduce renal prostaglandins and lithium clearance.', 'Monitor levels; consider acetaminophen instead.'),
    ...createInteraction('lithium', 'naproxen', 'major', 'Lithium toxicity risk.', 'Reduced renal clearance.', 'Monitor closely.'),

    // METHOTREXATE INTERACTIONS
    ...createInteraction('methotrexate', 'ibuprofen', 'major', 'Severe hematologic/GI toxicity.', 'NSAIDs reduce methotrexate renal excretion.', 'Avoid in high-dose MTX; monitor closely in RA.'),
    ...createInteraction('methotrexate', 'naproxen', 'major', 'Toxicity risk.', 'Reduced clearance.', 'Avoid combination.'),
    ...createInteraction('methotrexate', 'trimethoprim-sulfamethoxazole', 'major', 'Severe bone marrow suppression.', 'Additive folate antagonism + reduced clearance.', 'ABSOLUTE CONTRAINDICATION in many protocols.'),

    // NEURO/PSYCH SYNERGY
    ...createInteraction('haloperidol', 'metoclopramide', 'major', 'Extreme risk of dystonia/EPS.', 'Synergistic dopamine D2 blockade.', 'Avoid combination.'),
    ...createInteraction('risperidone', 'metoclopramide', 'major', 'Risk of severe Extrapyramidal Symptoms.', 'Additive D2 antagonism.', 'Avoid combination.'),
    ...createInteraction('quetiapine', 'haloperidol', 'major', 'Risk of fatal QT prolongation/Arrythmia.', 'Additive effect on cardiac repolarization.', 'Monitor ECG; avoid if possible.'),
    ...createInteraction('carbamazepine', 'quetiapine', 'moderate', 'Reduced antipsychotic efficacy.', 'Strong CYP3A4 induction by carbamazepine.', 'Increase quetiapine dose; monitor psychosis.'),
    ...createInteraction('valproate', 'lamotrigine', 'major', 'Life-threatening rash (SJS/TEN).', 'Valproate inhibits lamotrigine metabolism, doubling its levels.', 'Reduce lamotrigine dose by 50% and titrate SLOWLY.'),

    // IMMUNOSUPPRESSANT INTERACTIONS
    ...createInteraction('cyclosporine', 'atorvastatin', 'major', 'Severe rhabdomyolysis risk.', 'Inhibition of OATP1B1/CYP3A4 increases statin levels.', 'Limit atorvastatin to 10mg or avoid.'),
    ...createInteraction('tacrolimus', 'fluconazole', 'major', 'Tacrolimus toxicity (Renal/Neuro).', 'CYP3A4 inhibition increases tacrolimus levels.', 'Reduce tacrolimus dose; monitor trough levels.'),

    // MISC HOSPITAL INTERACTIONS
    ...createInteraction('gentamicin', 'vancomycin', 'moderate', 'Increased nephrotoxicity risk.', 'Additive renal tubular damage.', 'Monitor SCr and troughs.'),
    ...createInteraction('gentamicin', 'furosemide', 'major', 'Permanent hearing loss risk (Ototoxicity).', 'Synergistic damage to cochlear/vestibular structures.', 'Avoid if possible; monitor hearing and SCr.'),
    ...createInteraction('clopidogrel', 'omeprazole', 'moderate', 'Reduced antiplatelet efficacy.', 'CYP2C19 inhibition reduces activation of clopidogrel.', 'Use pantoprazole/famotidine instead.'),
    ...createInteraction('clopidogrel', 'esomeprazole', 'moderate', 'Reduced antiplatelet efficacy.', 'CYP2C19 inhibition.', 'Avoid combination.'),

    // ACUTE CARE & EMERGENCY INTERACTIONS
    ...createInteraction('heparin', 'enoxaparin', 'major', 'Extreme bleeding risk / Therapeutic duplication.', 'Additive anticoagulant effects via same pathway.', 'ABSOLUTE CONTRAINDICATION. Do not combine.'),
    ...createInteraction('heparin', 'aspirin', 'major', 'Increased bleeding risk.', 'Synergistic antiplatelet and anticoagulant effect.', 'Monitor signs of bleeding closely; bridge carefully.'),
    ...createInteraction('enoxaparin', 'naproxen', 'major', 'Risk of severe GI/Pathological bleeding.', 'NSAID-induced mucosal damage + anticoagulation.', 'Avoid combination during anticoagulation therapy.'),
    ...createInteraction('propofol', 'fentanyl', 'major', 'Severe respiratory depression and hypotension.', 'Synergistic CNS and respiratory depression.', 'Use reduced doses and continuous monitoring.'),
    ...createInteraction('epinephrine', 'metoprolol', 'major', 'Severe hypertension and bradycardia risk (Unopposed Alpha).', 'Beta-2 blockade leaves alpha-1 receptors unopposed during epi stimulation.', 'Monitor BP and HR closely; use cautiously.'),
    ...createInteraction('epinephrine', 'propranolol', 'major', 'Severe hypertension/bradycardia.', 'Unopposed alpha-adrenergic stimulation.', 'Avoid combination if possible.'),
    ...createInteraction('adenosine', 'theophylline', 'moderate', 'Reduced adenosine efficacy.', 'Competitive antagonism at adenosine receptors.', 'May require higher doses of adenosine.'),
    ...createInteraction('adenosine', 'caffeine', 'moderate', 'Reduced adenosine efficacy.', 'Competitive antagonism.', 'Avoid caffeine intake prior to adenosine testing/therapy.'),
    ...createInteraction('adenosine', 'dipyridamole', 'major', 'Potentiated adenosine effect.', 'Inhibition of adenosine uptake increases localized levels.', 'Reduce adenosine dose; monitor response.'),

    // BIOLOGIC & DMARD SYNERGY
    ...createInteraction('adalimumab', 'sulfasalazine', 'moderate', 'Increased risk of infection.', 'Additive immunosuppressive effect.', 'Monitor for signs of infection.'),
    ...createInteraction('sulfasalazine', 'methotrexate', 'moderate', 'Increased liver toxicity risk.', 'Additive hepatotoxicity.', 'Monitor LFTs regularly.'),

    // SPECIALTY & PED INTERACTION EXPANSION
    ...createInteraction('tamoxifen', 'fluoxetine', 'major', 'Reduced tamoxifen efficacy.', 'CYP2D6 inhibition prevents conversion of tamoxifen to its active metabolite (endoxifen).', 'Avoid combination; use SSRIs that do not inhibit CYP2D6 (e.g., escitalopram).'),
    ...createInteraction('tamoxifen', 'paroxetine', 'major', 'Reduced tamoxifen efficacy.', 'Potent CYP2D6 inhibition.', 'Avoid combination.'),
    ...createInteraction('imatinib', 'warfarin', 'major', 'Increased bleeding risk.', 'CYP2C9 inhibition increases warfarin levels.', 'Monitor INR closely; consider alternate anticoagulation.'),
    ...createInteraction('levodopa-carbidopa', 'haloperidol', 'major', 'Reduced levodopa efficacy / Worsening Parkinsonism.', 'Dopamine receptor blockade in the CNS.', 'Avoid combination; use atypical antipsychotics (quetiapine/clozapine) if needed.'),
    ...createInteraction('donepezil', 'ipratropium', 'moderate', 'Reduced efficacy of both agents.', 'Opposing effects on cholinergic/anticholinergic systems.', 'Monitor for reduced effectiveness.'),
    ...createInteraction('sumatriptan', 'sertraline', 'moderate', 'Risk of Serotonin Syndrome.', 'Additive serotonergic effects.', 'Monitor for agitation, diaphoresis, hyperreflexia.'),
    ...createInteraction('sumatriptan', 'fluoxetine', 'moderate', 'Risk of Serotonin Syndrome.', 'Additive serotonergic effects.', 'Monitor closely.'),
    ...createInteraction('amoxicillin-clavulanate', 'warfarin', 'moderate', 'May increase INR.', 'Alteration of gut flora affecting Vitamin K.', 'Monitor INR.'),
    ...createInteraction('cefdinir', 'ferrous-sulfate', 'moderate', 'Reduced cefdinir absorption.', 'Iron chelates with cefdinir in the GI tract.', 'Separate dosing by 2 hours; note: stools may turn red.'),
    ...createInteraction('diphenhydramine', 'morphine', 'major', 'Excessive CNS depression and sedation.', 'Additive sedative/respiratory depressive effects.', 'Monitor respiratory status; reduce doses if possible.'),
    ...createInteraction('diphenhydramine', 'alprazolam', 'major', 'Severe sedation and fall risk.', 'Additive CNS depression.', 'Avoid combination, especially in elderly.'),
    ...createInteraction('valacyclovir', 'gentamicin', 'moderate', 'Increased risk of nephrotoxicity.', 'Synergistic stress on renal tubules.', 'Monitor renal function and maintain hydration.'),

    // HOSPITAL & SPECIALTY INTERACTION EXPANSION 2
    ...createInteraction('linezolid', 'sertraline', 'major', 'Risk of Serotonin Syndrome.', 'Linezolid is a non-selective MAO inhibitor.', 'Avoid combination; monitor for tremor, hyperreflexia, and agitation.'),
    ...createInteraction('linezolid', 'fluoxetine', 'major', 'Risk of Serotonin Syndrome.', 'MAO inhibition + SSRI.', 'Avoid combination.'),
    ...createInteraction('meropenem', 'valproate', 'major', 'Severe reduction in valproate levels; Loss of seizure control.', 'Carbapenems inhibit valproate glucuronide hydrolysis.', 'Avoid combination; use alternate antibiotic if possible.'),
    ...createInteraction('phenytoin', 'warfarin', 'major', 'Reduced warfarin efficacy followed by increased bleeding risk.', 'Phenytoin induces CYP metabolism initially; later inhibits.', 'Monitor INR frequently; adjust warfarin.'),
    ...createInteraction('phenytoin', 'amiodarone', 'major', 'Phenytoin toxicity risk.', 'Inhibition of CYP2C9 metabolism by amiodarone.', 'Monitor phenytoin levels; reduce dose.'),
    ...createInteraction('phenobarbital', 'warfarin', 'major', 'Reduced warfarin efficacy.', 'Strong CYP induction increases warfarin metabolism.', 'Increase warfarin dose; monitor INR.'),
    ...createInteraction('midazolam', 'fentanyl', 'major', 'Severe respiratory depression and profound sedation.', 'Synergistic CNS and respiratory depression.', 'Manual ventilation/monitoring required in procedural settings.'),
    ...createInteraction('succinylcholine', 'metoclopramide', 'moderate', 'Prolonged neuromuscular blockade.', 'Metoclopramide inhibits plasma cholinesterase.', 'Monitor for prolonged apnea.'),
    ...createInteraction('pyridostigmine', 'metoprolol', 'moderate', 'Risk of severe bradycardia.', 'Additive cholinergic/bradycardic effect.', 'Monitor HR closely.'),
    ...createInteraction('thiamine', 'furosemide', 'moderate', 'Risk of thiamine deficiency.', 'Increased renal clearance of thiamine via diuresis.', 'Consider thiamine supplementation in chronic HF pts.'),

    // FINAL MILESTONE INTERACTION EXPANSION
    ...createInteraction('tizanidine', 'ciprofloxacin', 'major', 'Severe hypotension and CNS depression risk.', 'Ciprofloxacin (potent 1A2 inhibitor) significantly increases tizanidine levels.', 'ABSOLUTE CONTRAINDICATION. Avoid combination.'),
    ...createInteraction('tizanidine', 'fluvoxamine', 'major', 'Extreme hypotension risk.', 'Potent CYP1A2 inhibition.', 'ABSOLUTE CONTRAINDICATION.'),
    ...createInteraction('cyclobenzaprine', 'tramadol', 'major', 'Risk of Serotonin Syndrome and Seizures.', 'Additive serotonergic and CNS depressive effects.', 'Avoid combination or monitor extremely closely.'),
    ...createInteraction('cyclobenzaprine', 'sertraline', 'moderate', 'Risk of Serotonin Syndrome.', 'Additive serotonergic effect.', 'Monitor for tremor, heat, and agitation.'),
    ...createInteraction('pseudoephedrine', 'metoprolol', 'moderate', 'Reduced antihypertensive effect.', 'Alpha-adrenergic stimulation opposes beta-blockade.', 'Monitor blood pressure closely.'),
    ...createInteraction('bismuth-subsalicylate', 'warfarin', 'moderate', 'Increased bleeding risk.', 'Salicylate component may displace warfarin or inhibit platelets.', 'Monitor INR and signs of bleeding.'),
    ...createInteraction('famotidine', 'ketoconazole', 'moderate', 'Reduced antifungal efficacy.', 'Increased gastric pH reduces solubility of ketoconazole.', 'Avoid combination or administer ketoconazole with acidic soda.'),
    ...createInteraction('calcium-carbonate', 'ciprofloxacin', 'moderate', 'Reduced antibiotic absorption.', 'Cation-mediated chelation in the GI tract.', 'Separate dosing by 2 hours BEFORE or 6 hours AFTER calcium.'),
    ...createInteraction('calcium-carbonate', 'levothyroxine', 'moderate', 'Reduced thyroid absorption.', 'Binding in the GI tract.', 'Separate dosing by at least 4 hours.'),
    ...createInteraction('senna', 'digoxin', 'moderate', 'Increased digoxin toxicity risk.', 'Senna-induced hypokalemia sensitizes the heart to digoxin.', 'Monitor serum potassium and digoxin levels.'),
    ...createInteraction('senna', 'mineral-oil', 'moderate', 'Increased mineral oil absorption / Toxicity risk.', 'Surfactant effect of docusate increases systemic absorption of oil.', 'Do not use concomitantly.'),
    // BATCH 1 INTERACTIONS
    ...createInteraction('sacubitril-valsartan', 'lisinopril', 'major', 'Severe risk of angioedema.', 'Synergistic effect on bradykinin breakdown.', 'Contraindicated. Must have 36-hour washout when switching from ACEi.'),
    ...createInteraction('sacubitril-valsartan', 'spironolactone', 'major', 'High risk of hyperkalemia.', 'Triple blockade of RAA system.', 'Monitor K+ and renal function extremely closely.'),
    ...createInteraction('rivaroxaban', 'aspirin', 'major', 'Significant increase in major bleeding risk.', 'Combined anticoagulant and antiplatelet effects.', 'Assess risk-benefit; monitor for signs of bleeding.'),
    ...createInteraction('rivaroxaban', 'ibuprofen', 'major', 'High risk of GI bleeding.', 'Gastric mucosal irritation plus anticoagulation.', 'Avoid NSAIDs; use acetaminophen for pain.'),
    ...createInteraction('ticagrelor', 'aspirin', 'moderate', 'Increased bleeding risk.', 'Dual antiplatelet therapy (DAPT).', 'Standard post-PCI therapy but requires bleeding surveillance (Note: use aspirin <100mg with ticagrelor).'),
    ...createInteraction('ticagrelor', 'simvastatin', 'moderate', 'Increased simvastatin levels / Myopathy risk.', 'Inhibition of CYP3A4 by ticagrelor.', 'Limit simvastatin dose to 40mg.'),
    ...createInteraction('telmisartan', 'spironolactone', 'major', 'High risk of hyperkalemia.', 'Additive potassium sparing effects.', 'Monitor K+ regularly.'),
    // BATCH 2 INTERACTIONS
    ...createInteraction('cyclosporine', 'tacrolimus', 'major', 'Severe nephrotoxicity / Toxicity risk.', 'Synergistic calcineurin inhibition and overlapping toxicity.', 'Avoid combination.'),
    ...createInteraction('cyclosporine', 'simvastatin', 'major', 'High risk of rhabdomyolysis.', 'Inhibition of OATP1B1 and CYP3A4.', 'Contraindicated. Use low-dose rosuvastatin or avoid.'),
    ...createInteraction('tacrolimus', 'ritonavir', 'major', 'Extreme increase in tacrolimus levels.', 'Potent CYP3A4 inhibition.', 'Avoid combination; requires 90%+ dose reduction of tacrolimus if used.'),
    ...createInteraction('mycophenolate', 'aluminum-hydroxide', 'moderate', 'Reduced mycophenolate absorption.', 'Chelation/pH effect.', 'Separate by at least 2 hours.'),
    ...createInteraction('etanercept', 'rituximab', 'moderate', 'Increased risk of serious infections.', 'Additive immunosuppression.', 'Monitor closely; generally avoided in RA protocols.'),
    ...createInteraction('cyclosporine', 'amiodarone', 'moderate', 'Increased cyclosporine levels.', 'CYP3A4 and P-gp inhibition.', 'Monitor cyclosporine trough levels.'),
    // BATCH 3 & 4 INTERACTIONS
    ...createInteraction('canagliflozin', 'lisinopril', 'moderate', 'Risk of hypotension and hyperkalemia.', 'Synergistic effect on BP and potassium retention.', 'Monitor BP and K+ closely.'),
    ...createInteraction('pioglitazone', 'insulin', 'moderate', 'Increased risk of edema and heart failure.', 'Synergistic fluid retention.', 'Monitor for signs of HF.'),
    ...createInteraction('duloxetine', 'warfarin', 'moderate', 'Increased bleeding risk.', 'Serotonergic effects on platelets.', 'Monitor for signs of bleeding.'),
    ...createInteraction('duloxetine', 'sertraline', 'major', 'Risk of Serotonin Syndrome.', 'Duplicate serotonergic mechanism.', 'Generally avoid combination.'),
    ...createInteraction('bupropion', 'venlafaxine', 'moderate', 'Increased seizure risk and BP.', 'CYP2D6 inhibition by bupropion increases SNRI levels.', 'Monitor BP and seizure threshold.'),
    ...createInteraction('mirtazapine', 'alcohol', 'major', 'Severe CNS depression.', 'Additive sedation.', 'Avoid alcohol.'),
    ...createInteraction('levetiracetam', 'carbamazepine', 'moderate', 'Increased CNS side effects.', 'Pharmacodynamic synergy.', 'Monitor for somnolence and dizziness.'),
    ...createInteraction('topiramate', 'valproate', 'moderate', 'Risk of hyperammonemia and encephalopathy.', 'Metabolic interference.', 'Monitor ammonia levels and mental status.'),

    // BATCH 5 & 6 INTERACTION EXPANSION (NEW)
    ...createInteraction('empagliflozin', 'furosemide', 'moderate', 'Risk of hypovolemia and hypotension.', 'Synergistic diuretic effect.', 'Monitor BP and hydration status.'),
    ...createInteraction('empagliflozin', 'lisinopril', 'moderate', 'Risk of hypotension.', 'Additive blood pressure lowering.', 'Monitor BP.'),
    ...createInteraction('eplerenone', 'lisinopril', 'major', 'Severe risk of hyperkalemia.', 'Additive potassium sparing effects.', 'Monitor K+ within 1 week of initiation.'),
    ...createInteraction('eplerenone', 'spironolactone', 'major', 'Extreme risk of hyperkalemia.', 'Pharmacodynamic duplication.', 'Avoid combination; choose one K-sparing agent.'),
    ...createInteraction('sacubitril-valsartan', 'eplerenone', 'major', 'Risk of hyperkalemia.', 'Combined inhibition of RAA pathway.', 'Monitor K+ closely.'),
    ...createInteraction('dapagliflozin', 'telmisartan', 'moderate', 'Risk of symptomatic hypotension.', 'Additive BP lowering effects.', 'Monitor orthostatic BP.'),
    ...createInteraction('rivaroxaban', 'enoxaparin', 'major', 'Fatal bleeding risk.', 'Therapeutic duplication of anticoagulation.', 'ABSOLUTE CONTRAINDICATION. Use one or the other.'),
    ...createInteraction('rivaroxaban', 'clopidogrel', 'major', 'Significantly increased bleeding risk.', 'Combined anticoagulant and antiplatelet therapy.', 'Assess risk-benefit; monitor for bleeding.'),
    ...createInteraction('ticagrelor', 'naproxen', 'major', 'Increased bleeding risk.', 'NSAID-induced GI injury + potent antiplatelet.', 'Avoid NSAIDs; use alternatives.'),
    ...createInteraction('ticagrelor', 'fluoxetine', 'moderate', 'Increased bleeding risk.', 'SSRI-induced platelet dysfunction additive to ticagrelor.', 'Monitor for bruising/bleeding.'),
    ...createInteraction('venlafaxine', 'sumatriptan', 'moderate', 'Risk of Serotonin Syndrome.', 'Additive serotonergic effects.', 'Monitor for agitation/tremor.'),
    ...createInteraction('quetiapine', 'metoclopramide', 'major', 'Risk of severe Extrapyramidal Symptoms.', 'Antipsychotic + Prokinetic dopamine blockade.', 'Avoid combination.'),
    ...createInteraction('methotrexate', 'aspirin', 'major', 'MTX toxicity risk.', 'Reduced renal excretion of MTX by salicylates.', 'Avoid aspirin >81mg; monitor counts.'),
    ...createInteraction('allopurinol', 'azathioprine', 'major', 'Severe bone marrow suppression.', 'Inhibition of xanthine oxidase prevents azathioprine breakdown.', 'Reduce azathioprine dose by 75% or avoid.'),
    ...createInteraction('allopurinol', 'mercaptopurine', 'major', 'Severe toxicity risk.', 'Metabolic inhibition.', 'Significant dose reduction required.'),
    ...createInteraction('mycophenolate', 'acyclovir', 'moderate', 'Increased levels of both drugs.', 'Competition for renal tubular secretion.', 'Monitor for toxicity.')
];
