import React from 'react';

export const APP_FOOTER = (
  <footer className="w-full py-6 mt-auto text-gray-500 text-[10px] md:text-xs border-t border-gray-100 bg-white">
    <div className="flex flex-col items-center justify-center space-y-1 text-center">
      <p className="font-bold text-gray-400">© 2026 Copyright. All Rights Reserved</p>
      <p className="text-gray-600 font-black uppercase tracking-widest text-[11px] md:text-[13px]">ENGINEERED BY RAHUL KOTA</p>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-1 px-4">
        <p className="text-gray-500 font-bold text-[11px] md:text-[13px]"><span className="text-gray-400 uppercase tracking-tighter mr-1">CO-ENGINEERED BY:</span> Stephen Samuel, Lokesh Naga Sai & Johnson Paul</p>
        <p className="text-gray-500 font-bold text-[11px] md:text-[13px]"><span className="text-gray-400 uppercase tracking-tighter mr-1">MENTORED BY:</span> Dr. Krupa Rani</p>
      </div>
    </div>
  </footer>
);

export const DRUG_DATABASE = [
  // PEDIATRIC COMMON MEDICATIONS
  "Acetaminophen", "Ibuprofen", "Amoxicillin", "Azithromycin", "Cephalexin", 
  "Cefdinir", "Cefuroxime", "Ceftriaxone", "Penicillin VK", "Erythromycin",
  "Clarithromycin", "Doxycycline", "Trimethoprim-Sulfamethoxazole", "Nitrofurantoin",
  "Albuterol", "Levalbuterol", "Fluticasone", "Budesonide", "Montelukast",
  "Cetirizine", "Loratadine", "Fexofenadine", "Diphenhydramine", "Hydroxyzine",
  "Prednisone", "Prednisolone", "Dexamethasone", "Hydrocortisone", "Methylprednisolone",
  "Epinephrine", "Diphenhydramine", "Ranitidine", "Famotidine", "Omeprazole",
  "Lansoprazole", "Esomeprazole", "Pantoprazole", "Metoclopramide", "Ondansetron",
  "Granisetron", "Lactulose", "Polyethylene glycol", "Docusate", "Senna",
  "Polyethylene glycol 3350", "Miralax", "Iron sulfate", "Ferrous sulfate", "Vitamin D",
  "Vitamin D3", "Cholecalciferol", "Multivitamin", "Fluoride", "Phenobarbital",
  "Levetiracetam", "Topiramate", "Valproic acid", "Carbamazepine", "Gabapentin",
  "Methylphenidate", "Amphetamine salts", "Atomoxetine", "Guanfacine", "Clonidine",
  "Fluoxetine", "Sertraline", "Escitalopram", "Aripiprazole", "Risperidone",
  "Olanzapine", "Quetiapine", "Lithium", "Insulin", "Metformin",
  "Glimepiride", "Glyburide", "Levothyroxine", "Synthroid", "Methimazole",
  
  // GERIATRIC COMMON MEDICATIONS
  "Aspirin", "Clopidogrel", "Warfarin", "Apixaban", "Rivaroxaban", "Dabigatran",
  "Lisinopril", "Enalapril", "Ramipril", "Losartan", "Valsartan", "Amlodipine",
  "Metoprolol", "Atenolol", "Carvedilol", "Propranolol", "Diltiazem", "Verapamil",
  "Hydrochlorothiazide", "Furosemide", "Spironolactone", "Torsemide", "Bumetanide",
  "Atorvastatin", "Simvastatin", "Rosuvastatin", "Pravastatin", "Ezetimibe",
  "Metformin", "Glipizide", "Sitagliptin", "Empagliflozin", "Canagliflozin",
  "Insulin glargine", "Insulin lispro", "Insulin aspart", "Lantus", "Humalog",
  "Levothyroxine", "Liothyronine", "Methimazole", "Propylthiouracil",
  "Calcium carbonate", "Calcium citrate", "Vitamin D3", "Alendronate", "Risedronate",
  "Denosumab", "Zoledronic acid", "Teriparatide",
  "Donepezil", "Rivastigmine", "Galantamine", "Memantine",
  "Sertraline", "Escitalopram", "Venlafaxine", "Duloxetine", "Mirtazapine",
  "Trazodone", "Mirtazapine", "Aripiprazole", "Olanzapine", "Quetiapine",
  "Lorazepam", "Diazepam", "Clonazepam", "Temazepam", "Zolpidem",
  "Zaleplon", "Eszopiclone", "Melatonin", "Ramelteon",
  "Gabapentin", "Pregabalin", "Duloxetine", "Amitriptyline", "Nortriptyline",
  "Carbamazepine", "Oxcarbazepine", "Valproic acid", "Levetiracetam", "Topiramate",
  "Tamsulosin", "Finasteride", "Dutasteride", "Solifenacin", "Tolterodine",
  "Oxybutynin", "Mirabegron", "Tolterodine", "Darifenacin",
  "Omeprazole", "Pantoprazole", "Esomeprazole", "Rabeprazole", "Lansoprazole",
  "Metoclopramide", "Ondansetron", "Promethazine", "Prochlorperazine",
  "Acetaminophen", "Tramadol", "Oxycodone", "Hydrocodone", "Morphine",
  "Fentanyl", "Hydromorphone", "Methadone", "Buprenorphine",
  "Ipratropium", "Tiotropium", "Umeclidinium", "Glycopyrrolate", "Aclidinium",
  "Salmeterol", "Formoterol", "Olodaterol", "Vilanterol", "Indacaterol",
  
  // ADULT COMMON MEDICATIONS
  "Amoxicillin-clavulanate", "Ciprofloxacin", "Levofloxacin", "Moxifloxacin",
  "Nitrofurantoin", "Fosfomycin", "Mupirocin", "Bacitracin", "Neomycin",
  "Clindamycin", "Vancomycin", "Linezolid", "Daptomycin", "Ceftazidime",
  "Cefepime", "Meropenem", "Imipenem", "Piperacillin-tazobactam",
  "Azithromycin", "Clarithromycin", "Doxycycline", "Minocycline", "Tetracycline",
  "Metronidazole", "Tinidazole", "Secnidazole",
  "Fluconazole", "Itraconazole", "Voriconazole", "Amphotericin B", "Nystatin",
  "Acyclovir", "Valacyclovir", "Famciclovir", "Oseltamivir", "Zanamivir",
  "Amlodipine", "Nifedipine", "Diltiazem", "Verapamil", "Isosorbide",
  "Nitroglycerin", "Hydralazine", "Minoxidil", "Clonidine", "Methyldopa",
  "Propranolol", "Nadolol", "Atenolol", "Metoprolol", "Carvedilol", "Labetalol",
  "Furosemide", "Bumetanide", "Torsemide", "Spironolactone", "Eplerenone",
  "Triamterene", "Amiloride", "Hydrochlorothiazide", "Chlorthalidone", "Indapamide",
  "Lisinopril", "Enalapril", "Ramipril", "Quinapril", "Benazepril", "Fosinopril",
  "Losartan", "Valsartan", "Irbesartan", "Candesartan", "Olmesartan", "Telmisartan",
  "Aliskiren", "Sacubitril-valsartan",
  "Atorvastatin", "Simvastatin", "Rosuvastatin", "Pravastatin", "Lovastatin", "Pitavastatin",
  "Gemfibrozil", "Fenofibrate", "Niacin", "Ezetimibe", "Alirocumab", "Evolocumab",
  "Metformin", "Glipizide", "Glyburide", "Glimepiride", "Pioglitazone", "Rosiglitazone",
  "Sitagliptin", "Saxagliptin", "Linagliptin", "Alogliptin", "Vildagliptin",
  "Canagliflozin", "Dapagliflozin", "Empagliflozin", "Ertugliflozin",
  "Insulin regular", "Insulin NPH", "Insulin glargine", "Insulin detemir", "Insulin degludec",
  "Insulin lispro", "Insulin aspart", "Insulin glulisine",
  "Levothyroxine", "Liothyronine", "Liotrix", "Methimazole", "Propylthiouracil",
  "Hydrocortisone", "Prednisone", "Prednisolone", "Methylprednisolone", "Dexamethasone",
  "Fludrocortisone", "Betamethasone", "Triamcinolone", "Budesonide", "Beclomethasone",
  "Fluticasone", "Mometasone", "Ciclesonide",
  "Sertraline", "Fluoxetine", "Paroxetine", "Escitalopram", "Citalopram", "Fluvoxamine",
  "Venlafaxine", "Desvenlafaxine", "Duloxetine", "Levomilnacipran",
  "Amitriptyline", "Nortriptyline", "Imipramine", "Desipramine", "Doxepin",
  "Bupropion", "Mirtazapine", "Trazodone", "Nefazodone", "Vilazodone", "Vortioxetine",
  "Lithium", "Valproic acid", "Divalproex", "Lamotrigine", "Carbamazepine", "Oxcarbazepine",
  "Phenytoin", "Fosphenytoin", "Phenobarbital", "Primidone", "Topiramate", "Zonisamide",
  "Levetiracetam", "Brivaracetam", "Pregabalin", "Gabapentin", "Tiagabine", "Vigabatrin",
  "Haloperidol", "Chlorpromazine", "Thioridazine", "Perphenazine", "Fluphenazine",
  "Risperidone", "Olanzapine", "Quetiapine", "Ziprasidone", "Aripiprazole", "Clozapine",
  "Paliperidone", "Iloperidone", "Lurasidone", "Brexpiprazole", "Cariprazine",
  "Donepezil", "Rivastigmine", "Galantamine", "Memantine", "Tacrine",
  "Alprazolam", "Diazepam", "Lorazepam", "Clonazepam", "Temazepam", "Oxazepam",
  "Zolpidem", "Zaleplon", "Eszopiclone", "Ramelteon", "Suvorexant", "Lemborexant",
  "Methylphenidate", "Amphetamine", "Dextroamphetamine", "Lisdexamfetamine", "Atomoxetine",
  "Guanfacine", "Clonidine", "Modafinil", "Armodafinil",
  "Ibuprofen", "Naproxen", "Diclofenac", "Celecoxib", "Meloxicam", "Piroxicam",
  "Indomethacin", "Ketorolac", "Nabumetone", "Sulindac", "Etodolac",
  "Acetaminophen", "Tramadol", "Oxycodone", "Hydrocodone", "Morphine", "Hydromorphone",
  "Fentanyl", "Methadone", "Buprenorphine", "Naloxone", "Naltrexone",
  "Ondansetron", "Granisetron", "Dolasetron", "Palonosetron", "Aprepitant", "Fosaprepitant",
  "Metoclopramide", "Prochlorperazine", "Promethazine", "Dimenhydrinate", "Meclizine",
  "Omeprazole", "Esomeprazole", "Lansoprazole", "Pantoprazole", "Rabeprazole", "Dexlansoprazole",
  "Famotidine", "Cimetidine", "Nizatidine", "Ranitidine",
  "Aluminum hydroxide", "Magnesium hydroxide", "Calcium carbonate", "Sucralfate", "Misoprostol",
  "Polyethylene glycol", "Lactulose", "Senna", "Bisacodyl", "Docusate", "Psyllium",
  "Loperamide", "Diphenoxylate", "Octreotide", "Rifaximin"
];
