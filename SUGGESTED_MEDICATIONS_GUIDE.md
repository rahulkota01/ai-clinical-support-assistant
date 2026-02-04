# Quick Reference Guide - Suggested Medications Feature

## For Healthcare Providers

### How to Suggest Medications with Full Prescription Details

#### Step 1: Navigate to Drug Information Tab
1. Open a patient case or create a new patient
2. Click on the **"Drug Information"** tab

#### Step 2: Add Medications for Analysis
- Use the search box to find drugs
- Drugs from AI, Logic engine, or Manual entry will appear in the analysis

#### Step 3: Complete Prescription Details
In the **"Suggest Medications Based on Interactions"** section:

1. Find the drug you want to suggest
2. Fill in the **mandatory fields**:
   - **Dose**: e.g., "500mg", "10mg", "2 tablets"
   - **Frequency**: Select from dropdown (QD, BID, TID, QID, PRN, STAT)
   - **Route**: Select from dropdown (Oral, IV, IM, SC, Sublingual, Topical, PR)

3. Click **"Add to Suggestions"**
   - The card will turn green
   - Status will show "✓ Added to suggested medications"

#### Step 4: View Suggested Medications in Patient Profile
1. Go to the **"Registry"** tab
2. Select the patient
3. Scroll to **"Comprehensive Clinical Profile"**
4. You'll see a new section: **"💡 Suggested Medications (from Drug Information)"**

This section displays:
- Drug name
- Dose, Frequency, Route in a clean grid
- Source badge (AI/Logic/Manual)
- Emerald-colored cards for easy identification

---

## Visual Guide

### Before Adding:
```
┌─────────────────────────────────────────────┐
│ Aspirin                            [AI]      │
│                                              │
│ Dose: [____]  Frequency: [____]  Route: [_] │
│                                              │
│ * All fields are mandatory                  │
│ [Add to Suggestions] (disabled)             │
└─────────────────────────────────────────────┘
```

### After Filling Details:
```
┌─────────────────────────────────────────────┐
│ Aspirin                            [AI]      │
│                                              │
│ Dose: [81mg]  Frequency: [QD]  Route: [Oral]│
│                                              │
│ ✓ Ready to add                              │
│ [Add to Suggestions] (enabled, green)       │
└─────────────────────────────────────────────┘
```

### After Adding:
```
┌─────────────────────────────────────────────┐
│ Aspirin                            [AI]      │
│                                              │
│ Dose: 81mg  Frequency: QD  Route: Oral      │
│                                              │
│ ✓ Added to suggested medications            │
│ [Remove] (red)                              │
└─────────────────────────────────────────────┘
```

### In Patient Profile:
```
💡 Suggested Medications (from Drug Information):

┌─────────────────────────────────────────────┐
│ Aspirin                            [AI]      │
│ ┌─────────┬──────────────┬────────────────┐ │
│ │ Dose:   │ Frequency:   │ Route:         │ │
│ │ 81mg    │ QD           │ Oral           │ │
│ └─────────┴──────────────┴────────────────┘ │
└─────────────────────────────────────────────┘
```

---

## Frequency Options Explained

- **QD (Once Daily)**: Take once per day
- **BID (Twice Daily)**: Take twice per day
- **TID (Thrice Daily)**: Take three times per day
- **QID (4x Daily)**: Take four times per day
- **PRN (As Needed)**: Take as needed for symptoms
- **STAT (Immediately)**: Give immediately, one-time dose

---

## Route Options Explained

- **Oral**: By mouth (tablets, capsules, liquids)
- **IV**: Intravenous (into vein)
- **IM**: Intramuscular (into muscle)
- **SC**: Subcutaneous (under skin)
- **Sublingual**: Under the tongue
- **Topical**: Applied to skin
- **PR**: Per rectum (rectal administration)

---

## Important Notes

### ✅ What Works:
- Suggested medications persist across tab switches
- Multiple drugs can be suggested for one patient
- Each drug tracks its source (AI/Logic/Manual)
- All prescription details are saved and displayed
- Remove button allows you to unsuggest a medication

### ⚠️ What to Remember:
- All three fields (Dose, Frequency, Route) are **mandatory**
- You cannot add a medication until all fields are filled
- Suggested medications appear in HCP Portal only
- Patients do NOT see suggested medications in their discharge summary
- Suggested medications are separate from baseline medications

### 🔒 Privacy & Security:
- Drug names are **hidden** from patient portal discharge summary
- Only HCP portal users can see suggested medications
- Prescription details are protected
- Patients only see general health guidance, not specific drugs

---

## Troubleshooting

**Q: I added a medication but don't see it in the patient profile**
- A: Make sure you filled all three fields (Dose, Frequency, Route)
- A: Check that you clicked "Add to Suggestions" (card should turn green)
- A: Navigate to Registry tab and select the patient to view

**Q: The "Add to Suggestions" button is disabled**
- A: Fill in all three mandatory fields first
- A: All fields must have values before you can add

**Q: Can I edit a suggested medication after adding?**
- A: Click "Remove" to unsuggest it, then add it again with new details

**Q: Where do suggested medications appear?**
- A: In the Registry tab → Select patient → "Comprehensive Clinical Profile" section

**Q: Can patients see the suggested medications?**
- A: No, suggested medications are only visible in HCP Portal, not Patient Portal

---

## Best Practices

1. **Be Specific with Dosing**
   - Use standard medical abbreviations
   - Include units (mg, mcg, mL, tablets, etc.)
   - Example: "500mg", "10 units", "2 tablets"

2. **Choose Appropriate Frequency**
   - Match frequency to clinical need
   - Consider patient compliance
   - Use PRN for symptom-based medications

3. **Select Correct Route**
   - Match route to medication formulation
   - Consider patient's ability to take medication
   - Document special administration instructions elsewhere

4. **Review Before Suggesting**
   - Check for drug interactions in the Drug Information tab
   - Verify dose is appropriate for patient age/weight
   - Ensure route is feasible for patient

5. **Document Rationale**
   - Use AI analysis or clinical notes to document why drug was suggested
   - Reference source (AI/Logic/Manual) for transparency

---

## Integration with Existing Features

### Works With:
- ✅ Drug Information tab (source of suggestions)
- ✅ Drug interaction checking
- ✅ Patient registry
- ✅ AI analysis
- ✅ Logic-based recommendations

### Separate From:
- Baseline medications (patient's current medications)
- Discharge summary (patients don't see suggested meds)
- AI report medications (those are in the analysis text)

---

## Future Enhancements (Planned)

- Database persistence for long-term storage
- Include suggested medications in printed reports
- Notification system when medications are suggested
- Interaction warnings in suggestion display
- Auto-suggest common dosages from drug database

---

## Support

If you encounter any issues:
1. Check this guide first
2. Verify all mandatory fields are filled
3. Check browser console for errors
4. Review UPGRADE_SUMMARY_2026-02-03.md for technical details

---

**Last Updated**: 2026-02-03
**Version**: 2.5.1
**Feature**: Suggested Medications with Full Prescription Details
