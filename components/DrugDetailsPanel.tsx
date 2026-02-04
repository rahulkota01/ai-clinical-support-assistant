import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Medication } from '../types';
import { enhancedDrugInteractionService, DrugInteraction, DrugDetail } from '../services/enhancedDrugInteractionService';
import { datasetService } from '../services/datasetService';
import { DRUG_DATABASE as CLINICAL_DB } from '../services/drugDatabase';
import { DRUG_DATABASE as CONSTANT_DB } from '../constants';

// Simple in-memory cache for drug details
const drugDetailsCache = new Map<string, DrugDetail>();

interface SuggestedMedication {
    name: string;
    source: 'AI' | 'Logic' | 'Manual';
    dose: string;
    frequency: string;
    route: string;
    isComplete: boolean;
}

interface DrugDetailsProps {
    medications: Medication[];
    aiSuggestedDrugs?: string[];
    logicSuggestedDrugs?: Array<{ name: string; category?: string;[key: string]: any }>;
    extraMedications?: string[];
    removedMedications?: Set<string>;
    onExtraMedicationsChange?: (meds: string[]) => void;
    onRemovedMedicationsChange?: (meds: Set<string>) => void;
    suggestedMedications?: SuggestedMedication[];
    onSuggestedMedicationsChange?: (meds: SuggestedMedication[]) => void;
}


export const DrugInformationPanel: React.FC<DrugDetailsProps> = ({
    medications,
    aiSuggestedDrugs = [],
    logicSuggestedDrugs = [],
    extraMedications: externalExtraMeds,
    removedMedications: externalRemovedMeds,
    onExtraMedicationsChange,
    onRemovedMedicationsChange,
    suggestedMedications: externalSuggestedMeds,
    onSuggestedMedicationsChange
}) => {
    const [selectedDrug, setSelectedDrug] = useState<DrugDetail | null>(null);
    const [interactions, setInteractions] = useState<DrugInteraction[]>([]);
    const [drugDetails, setDrugDetails] = useState<DrugDetail[]>([]);
    const [selectedForInteraction, setSelectedForInteraction] = useState<Set<string>>(new Set());
    const [drugSources, setDrugSources] = useState<Record<string, string[]>>({});
    const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'no_interactions'>('idle');

    // Use external state if provided, otherwise use local state
    const extraMedications = externalExtraMeds ?? [];
    const removedMedications = externalRemovedMeds ?? new Set<string>();
    const suggestedMedications = externalSuggestedMeds ?? [];

    const setExtraMedications = (meds: string[] | ((prev: string[]) => string[])) => {
        const newMeds = typeof meds === 'function' ? meds(extraMedications) : meds;
        onExtraMedicationsChange?.(newMeds);
    };
    const setRemovedMedications = (meds: Set<string> | ((prev: Set<string>) => Set<string>)) => {
        const newMeds = typeof meds === 'function' ? meds(removedMedications) : meds;
        onRemovedMedicationsChange?.(newMeds);
    };
    const setSuggestedMedications = (meds: SuggestedMedication[] | ((prev: SuggestedMedication[]) => SuggestedMedication[])) => {
        const newMeds = typeof meds === 'function' ? meds(suggestedMedications) : meds;
        onSuggestedMedicationsChange?.(newMeds);
    };

    const handleClearAll = () => {
        if (window.confirm("Are you sure you want to clear all manually added medications and resets?")) {
            setExtraMedications([]);
            setRemovedMedications(new Set());
            setSuggestedMedications([]);
            console.log("🧹 Drug Information Panel cleared.");
        }
    };

    const [newDrugSearch, setNewDrugSearch] = useState('');
    const [searchResults, setSearchResults] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);

    useEffect(() => {
        const analyzeDrugs = async () => {
            setAnalysisStatus('loading');
            try {
                // Combine all sources: patient meds, AI suggestions, Logic suggestions, and manual additions
                const patientMedNames = medications.map(m => m.name.toLowerCase());
                const aiSuggestions = aiSuggestedDrugs.map(d => d.toLowerCase());
                const logicSuggestions = logicSuggestedDrugs.map(d => d.name.toLowerCase());

                // Final merged list excluding removed ones
                const allDrugNames = Array.from(new Set([
                    ...patientMedNames,
                    ...aiSuggestions,
                    ...logicSuggestions,
                    ...extraMedications.map(m => m.toLowerCase())
                ])).filter(name => !removedMedications.has(name));

                // Map sources for display
                const sourcesMap: Record<string, string[]> = {};
                medications.forEach(m => {
                    const name = m.name?.trim().toLowerCase();
                    if (name && !removedMedications.has(name)) {
                        if (!sourcesMap[name]) sourcesMap[name] = [];
                        if (!sourcesMap[name].includes('Manual')) sourcesMap[name].push('Manual');
                    }
                });
                aiSuggestedDrugs.forEach(name => {
                    const lowerName = name?.trim().toLowerCase();
                    if (lowerName && !removedMedications.has(lowerName)) {
                        if (!sourcesMap[lowerName]) sourcesMap[lowerName] = [];
                        if (!sourcesMap[lowerName].includes('AI')) sourcesMap[lowerName].push('AI');
                    }
                });
                logicSuggestedDrugs.forEach(d => {
                    const name = d.name?.trim().toLowerCase();
                    if (name && !removedMedications.has(name)) {
                        if (!sourcesMap[name]) sourcesMap[name] = [];
                        if (!sourcesMap[name].includes('Logic')) sourcesMap[name].push('Logic');
                    }
                });
                extraMedications.forEach(name => {
                    const lowerName = name?.trim().toLowerCase();
                    if (lowerName && !removedMedications.has(lowerName)) {
                        if (!sourcesMap[lowerName]) sourcesMap[lowerName] = [];
                        if (!sourcesMap[lowerName].includes('Manual')) sourcesMap[lowerName].push('Manual');
                    }
                });

                if (allDrugNames.length === 0) {
                    setDrugDetails([]);
                    setInteractions([]);
                    setAnalysisStatus('idle');
                    return;
                }

                // Get details for each drug with caching and reduced timeout
                const detailsPromises = allDrugNames.map(async (name) => {
                    const cacheKey = name.toLowerCase();
                    if (drugDetailsCache.has(cacheKey)) {
                        return drugDetailsCache.get(cacheKey)!;
                    }

                    try {
                        // Reduced timeout to 1.5s for faster loading
                        const timeoutPromise = new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Timeout')), 1500)
                        );
                        const detailsPromise = enhancedDrugInteractionService.getDrugDetails(name);
                        const details = await Promise.race([detailsPromise, timeoutPromise]) as DrugDetail;
                        drugDetailsCache.set(cacheKey, details); // Cache the result
                        return details;
                    } catch (error) {
                        console.warn(`Failed to get details for ${name}:`, error);
                        // Return basic drug info if detailed lookup fails
                        const fallbackDetails = {
                            name: name,
                            category: 'Unknown',
                            indication: 'Information unavailable',
                            mechanism: 'Information unavailable',
                            sideEffects: ['Information unavailable'],
                            contraindications: ['Information unavailable'],
                            dosing: 'Information unavailable',
                            monitoring: 'Information unavailable'
                        };
                        drugDetailsCache.set(cacheKey, fallbackDetails); // Cache fallback too
                        return fallbackDetails;
                    }
                });
                const details = await Promise.all(detailsPromises) as DrugDetail[];
                const detailsMap = new Map(details.map(d => [d.name.toLowerCase(), d]));

                // Initial Interaction Check (All selected)
                const foundInteractions = await enhancedDrugInteractionService.checkAllInteractions(allDrugNames);

                // Default select all for interaction check (only if not already set or if new drugs added)
                setSelectedForInteraction(prev => {
                    const newSet = new Set(allDrugNames);
                    // Retain selection for existing drugs, but remove those that are gone
                    const filteredPrev = new Set([...prev].filter(n => newSet.has(n)));
                    // If it's the first load or everything was selected, select all
                    if (prev.size === 0 || filteredPrev.size === 0) return newSet; // If all previous were removed, select all new
                    return filteredPrev;
                });

                setDrugDetails(Array.from(detailsMap.values()));
                setDrugSources(sourcesMap);
                setInteractions(foundInteractions);
                setAnalysisStatus(foundInteractions.length > 0 ? 'success' : 'no_interactions');
            } catch (err) {
                console.error("Interaction analysis error:", err);
                setAnalysisStatus('error');
            }
        };

        analyzeDrugs();
    }, [medications, aiSuggestedDrugs, logicSuggestedDrugs, extraMedications, removedMedications]);

    const handleInteractionCheck = async () => {
        const selected: string[] = Array.from(selectedForInteraction);
        if (selected.length < 2) {
            alert("Please select at least 2 drugs to check interactions.");
            return;
        }
        setAnalysisStatus('loading');
        try {
            const newInteractions = await enhancedDrugInteractionService.checkAllInteractions(selected);
            setInteractions(newInteractions);
            setAnalysisStatus(newInteractions.length > 0 ? 'success' : 'no_interactions');
        } catch (e) {
            console.error(e);
            setAnalysisStatus('error');
        }
    };

    // Debounced search to improve performance
    const debouncedSearch = useCallback(
        useMemo(() => {
            let timeoutId: NodeJS.Timeout;
            return (val: string) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    if (val.length >= 2) {
                        const lower = val.toLowerCase();

                        // 1. Get large dataset matches
                        const datasetMatches = datasetService.getDrugSuggestions(val, 8);

                        // 2. Get local static DB matches
                        const staticMatches = Object.keys(CLINICAL_DB)
                            .filter(d => d.toLowerCase().includes(lower))
                            .slice(0, 4);

                        // 3. Combine and Deduplicate
                        const combined = Array.from(new Set([
                            ...datasetMatches.map(s => s.charAt(0).toUpperCase() + s.slice(1)), // Capitalize
                            ...staticMatches
                        ])).slice(0, 10);

                        setSuggestions(combined);
                    } else {
                        setSuggestions([]);
                    }
                }, 300); // 300ms debounce
            };
        }, []),
        []
    );

    const handleSearchChange = (val: string) => {
        setSearchTerm(val);
        debouncedSearch(val);
    };

    const addExtraMed = (name: string) => {
        const lowerName = name.toLowerCase();
        if (removedMedications.has(lowerName)) {
            const newRemoved = new Set<string>(removedMedications);
            newRemoved.delete(lowerName);
            setRemovedMedications(newRemoved);
        }
        if (!extraMedications.includes(lowerName)) {
            setExtraMedications([...extraMedications, lowerName]);
        }
        setSearchTerm('');
        setSuggestions([]);
    };

    const handleRemoveDrug = (drugName: string) => {
        setRemovedMedications(prev => {
            const next = new Set(prev);
            next.add(drugName.toLowerCase());
            return next;
        });
    };

    const handleAddDrug = () => {
        if (newDrugSearch.trim()) {
            const name = newDrugSearch.trim().toLowerCase();
            if (removedMedications.has(name)) {
                setRemovedMedications(prev => {
                    const next = new Set(prev);
                    next.delete(name);
                    return next;
                });
            } else if (!extraMedications.includes(name)) {
                setExtraMedications(prev => [...prev, name]);
            }
            setNewDrugSearch('');
            setSearchResults([]);
        }
    };

    const toggleDrugSelection = (name: string) => {
        const newSet = new Set(selectedForInteraction);
        if (newSet.has(name.toLowerCase())) newSet.delete(name.toLowerCase());
        else newSet.add(name.toLowerCase());
        setSelectedForInteraction(newSet);
    };

    const getSeverityStats = () => {
        const major = interactions.filter(i => i.severity === 'major').length;
        const moderate = interactions.filter(i => i.severity === 'moderate').length;
        const minor = interactions.filter(i => i.severity === 'minor').length;
        return { major, moderate, minor, total: interactions.length };
    };

    const stats = getSeverityStats();

    if (medications.length === 0 && aiSuggestedDrugs.length === 0 && logicSuggestedDrugs.length === 0 && extraMedications.length === 0 && removedMedications.size === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">💊</span>
                </div>
                <h3 className="text-lg font-black text-slate-700 mb-2">No Medications Found</h3>
                <p className="text-sm text-slate-500">Add medications or run clinical analysis to see drug details.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Search and Quick Add */}
            <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg text-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tight">Search & Add Medication</h3>
                        <p className="text-xs text-indigo-100 font-medium">Verify interactions for additional medications instantly.</p>
                    </div>
                    <div className="relative flex-1 max-w-md">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder="Type drug name (e.g., Warfarin)..."
                                className="w-full bg-white/10 border-2 border-white/20 rounded-xl px-4 py-3 pr-12 text-sm font-bold placeholder:text-indigo-200 focus:bg-white focus:text-indigo-900 focus:border-white transition-all outline-none"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl">🔍</div>
                        </div>

                        {suggestions.length > 0 && (
                            <div className="absolute z-50 w-full bg-white rounded-xl mt-2 shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                {suggestions.map((name, i) => {
                                    const isPremium = !!CLINICAL_DB[name.toLowerCase()];
                                    return (
                                        <div
                                            key={i}
                                            onClick={() => addExtraMed(name)}
                                            className="px-4 py-3 hover:bg-indigo-50 cursor-pointer flex items-center justify-between group transition-colors border-b border-slate-50 last:border-0"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900 group-hover:text-indigo-700">{name}</span>
                                                {isPremium && (
                                                    <span className="text-[10px] text-green-600 font-black uppercase tracking-widest flex items-center">
                                                        <span className="mr-1">✨</span> Premium Clinical Data
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-lg md:opacity-0 group-hover:opacity-100 transition-opacity">➕</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Control Panel */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Analysis Configuration</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={handleClearAll}
                            className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-xs font-black uppercase hover:bg-red-50 hover:text-red-600 transition flex items-center gap-2"
                        >
                            <span>🧹</span> Clear All
                        </button>
                        <button
                            onClick={handleInteractionCheck}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase shadow hover:bg-indigo-700 transition"
                        >
                            Re-Analyze Selected ({selectedForInteraction.size})
                        </button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {drugDetails.map(drug => (
                        <div
                            key={drug.name}
                            onClick={() => toggleDrugSelection(drug.name)}
                            className={`cursor-pointer px-3 py-2 rounded-lg border-2 text-xs font-bold transition select-none ${selectedForInteraction.has(drug.name.toLowerCase())
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                : 'bg-slate-50 border-slate-200 text-slate-400 opacity-75'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${selectedForInteraction.has(drug.name.toLowerCase()) ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                                {drug.name}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Interaction Status Banner */}
            {analysisStatus === 'no_interactions' && (
                <div className="bg-green-50 rounded-2xl shadow-sm p-6 border-l-4 border-green-500 flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl">✓</div>
                    <div>
                        <h3 className="text-sm font-black text-green-900 uppercase">No Drug Interactions Found</h3>
                        <p className="text-xs text-green-700 font-medium">Safe to proceed with current selection.</p>
                    </div>
                </div>
            )}

            {analysisStatus === 'error' && (
                <div className="bg-red-50 rounded-2xl shadow-sm p-6 border-l-4 border-red-500 flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-xl">⚠️</div>
                    <div>
                        <h3 className="text-sm font-black text-red-900 uppercase">Analysis Service Unavailable</h3>
                        <p className="text-xs text-red-700 font-medium">Could not verify interactions at this time. Please check manually.</p>
                    </div>
                </div>
            )}

            {/* Interaction Summary Card */}
            {interactions.length > 0 && (
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl shadow-lg p-6 border-l-4 border-red-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">⚠️</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-red-900 uppercase tracking-tight">Drug Interactions Detected</h3>
                                <p className="text-xs text-red-700">Found {stats.total} potential interaction{stats.total !== 1 ? 's' : ''}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                        {stats.major > 0 && (
                            <div className="bg-red-100 rounded-xl p-3 text-center border-2 border-red-300">
                                <p className="text-2xl font-black text-red-700">{stats.major}</p>
                                <p className="text-xs font-bold text-red-600 uppercase tracking-wider">🔴 Major</p>
                            </div>
                        )}
                        {stats.moderate > 0 && (
                            <div className="bg-yellow-100 rounded-xl p-3 text-center border-2 border-yellow-300">
                                <p className="text-2xl font-black text-yellow-700">{stats.moderate}</p>
                                <p className="text-xs font-bold text-yellow-600 uppercase tracking-wider">🟡 Moderate</p>
                            </div>
                        )}
                        {stats.minor > 0 && (
                            <div className="bg-green-100 rounded-xl p-3 text-center border-2 border-green-300">
                                <p className="text-2xl font-black text-green-700">{stats.minor}</p>
                                <p className="text-xs font-bold text-green-600 uppercase tracking-wider">🟢 Minor</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Interaction Details */}
            {interactions.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center">
                        <span className="text-xl mr-2">🔍</span>
                        Detailed Interaction Analysis
                    </h3>
                    <div className="space-y-3">
                        {interactions.map((interaction, idx) => (
                            <div
                                key={idx}
                                className={`rounded-xl p-4 border-l-4 ${enhancedDrugInteractionService.getSeverityColorClass(interaction.severity)}`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{enhancedDrugInteractionService.getSeverityIcon(interaction.severity)}</span>
                                        <h4 className="text-sm font-black uppercase">
                                            {interaction.drug1} + {interaction.drug2}
                                        </h4>
                                    </div>
                                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/50 uppercase">
                                        {interaction.severity}
                                    </span>
                                </div>

                                <p className="text-xs font-bold mb-2">{interaction.description}</p>

                                {interaction.mechanism && (
                                    <div className="bg-white/50 rounded-lg p-2 mb-2">
                                        <p className="text-xs font-bold text-slate-600">
                                            <span className="uppercase tracking-wider">Mechanism:</span> {interaction.mechanism}
                                        </p>
                                    </div>
                                )}

                                {interaction.recommendation && (
                                    <div className="bg-white rounded-lg p-2 border-2 border-current">
                                        <p className="text-xs font-black">
                                            <span className="uppercase tracking-wider">⚡ Recommendation:</span> {interaction.recommendation}
                                        </p>
                                    </div>
                                )}

                                <div className="mt-2 flex items-center gap-2 text-xs">
                                    <span className="font-bold text-slate-500">Source: {interaction.source}</span>
                                    <span className="font-bold text-slate-500">• Confidence: {Math.round(interaction.confidence * 100)}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Suggest Medications Based on Interactions */}
            {drugDetails.length > 0 && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl shadow-lg p-6 border-l-4 border-emerald-500">
                    <h3 className="text-sm font-black text-emerald-900 uppercase tracking-wider mb-4 flex items-center">
                        <span className="text-xl mr-2">💡</span>
                        Suggest Medications Based on Interactions
                    </h3>
                    <p className="text-xs text-emerald-700 mb-4 font-medium">
                        Review and complete medication details for drugs identified from AI/Logic/Manual sources.
                        <strong className="text-emerald-900"> All fields (Dose, Frequency, Route) are mandatory before submission.</strong>
                    </p>

                    <div className="space-y-3">
                        {drugDetails.map((drug, idx) => {
                            const sources = drugSources[drug.name.toLowerCase()] || [];
                            const isFromAILogicManual = sources.some(s => ['AI', 'Logic', 'Manual'].includes(s));

                            if (!isFromAILogicManual) return null;

                            const existingMed = suggestedMedications.find(m => m.name.toLowerCase() === drug.name.toLowerCase());

                            return (
                                <SuggestMedicationCard
                                    key={idx}
                                    drug={drug}
                                    sources={sources}
                                    existingMedication={existingMed}
                                    onAdd={(med) => {
                                        setSuggestedMedications(prev => {
                                            const filtered = prev.filter(m => m.name.toLowerCase() !== med.name.toLowerCase());
                                            return [...filtered, med];
                                        });
                                    }}
                                    onRemove={(drugName) => {
                                        setSuggestedMedications(prev =>
                                            prev.filter(m => m.name.toLowerCase() !== drugName.toLowerCase())
                                        );
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Drug Details Cards */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center">
                    <span className="text-xl mr-2">💊</span>
                    Comprehensive Drug Information
                </h3>

                {analysisStatus === 'loading' ? (
                    <div className="text-center py-8">
                        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-sm text-slate-500 font-bold">Loading drug information...</p>
                    </div>
                ) : (
                    <>
                        {/* Manual Drug Adder */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex-1 relative">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Quick Add Drug for Analysis</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newDrugSearch}
                                            onChange={(e) => {
                                                setNewDrugSearch(e.target.value);
                                                if (e.target.value.length > 1) {
                                                    const datasetMatches = datasetService.getDrugSuggestions(e.target.value, 5);
                                                    setSearchResults(datasetMatches.map(s => s.charAt(0).toUpperCase() + s.slice(1)));
                                                } else {
                                                    setSearchResults([]);
                                                }
                                            }}
                                            placeholder="Search drug to add (e.g. Warfarin)..."
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-400 transition-all font-medium"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddDrug()}
                                        />
                                        <button
                                            onClick={handleAddDrug}
                                            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 flex items-center gap-2 whitespace-nowrap"
                                        >
                                            <span>➕ Add Drug</span>
                                        </button>
                                    </div>
                                    {searchResults.length > 0 && (
                                        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-slate-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                            {searchResults.map(res => (
                                                <button
                                                    key={res}
                                                    onClick={() => {
                                                        setNewDrugSearch(res);
                                                        setSearchResults([]);
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-50 last:border-0 font-medium text-slate-700 capitalize"
                                                >
                                                    {res}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {drugDetails.map((drug, idx) => (
                                <div
                                    key={idx}
                                    className="border-2 border-slate-100 rounded-xl p-4 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group"
                                    onClick={() => setSelectedDrug(drug)}
                                >
                                    {/* Remove Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveDrug(drug.name);
                                        }}
                                        className="absolute top-2 left-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:text-white z-10"
                                        title="Remove from analysis"
                                    >
                                        ✕
                                    </button>

                                    <div className="absolute top-0 right-0 p-2 flex gap-1">
                                        {(drugSources[drug.name.toLowerCase()] || []).map(source => (
                                            <span key={source} className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${source === 'Manual' ? 'bg-blue-100 text-blue-700' :
                                                source === 'AI' ? 'bg-purple-100 text-purple-700' :
                                                    source === 'Logic' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-indigo-100 text-indigo-700'
                                                }`}>
                                                {source}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="flex items-start justify-between mb-3 mt-4">
                                        <div className="pl-6">
                                            <h4 className="text-base font-black text-indigo-900 capitalize">{drug.name}</h4>
                                            {drug.genericName && drug.genericName.toLowerCase() !== drug.name.toLowerCase() && (
                                                <p className="text-xs text-slate-500 font-bold">Generic: {drug.genericName}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="bg-blue-50 rounded-lg p-2">
                                            <p className="text-xs font-bold text-blue-900 truncate">
                                                <span className="uppercase tracking-wider">Indication:</span> {drug.indication}
                                            </p>
                                        </div>
                                        <button className="mt-1 w-full py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition">
                                            View Full Details →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Detailed Drug Modal */}
            {selectedDrug && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedDrug(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-indigo-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black uppercase">{selectedDrug.name}</h3>
                                <p className="text-sm opacity-80">{selectedDrug.category}</p>
                            </div>
                            <button onClick={() => setSelectedDrug(null)} className="p-2 hover:bg-white/20 rounded-full transition">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <DetailSection title="Indication" icon="🎯" content={selectedDrug.indication} />
                            <DetailSection title="Mechanism of Action" icon="⚙️" content={selectedDrug.mechanism} />
                            <DetailSection title="Dosing" icon="💉" content={selectedDrug.dosing} />
                            <DetailSection title="Monitoring" icon="📊" content={selectedDrug.monitoring} />

                            <div className="bg-red-50 rounded-xl p-4 border-l-4 border-red-500">
                                <h4 className="text-sm font-black text-red-900 uppercase mb-2 flex items-center">
                                    <span className="mr-2">⚠️</span> Side Effects
                                </h4>
                                <ul className="list-disc list-inside space-y-1">
                                    {selectedDrug.sideEffects.map((effect, idx) => (
                                        <li key={idx} className="text-xs font-bold text-red-800">{effect}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-orange-50 rounded-xl p-4 border-l-4 border-orange-500">
                                <h4 className="text-sm font-black text-orange-900 uppercase mb-2 flex items-center">
                                    <span className="mr-2">🚫</span> Contraindications
                                </h4>
                                <ul className="list-disc list-inside space-y-1">
                                    {selectedDrug.contraindications.map((contra, idx) => (
                                        <li key={idx} className="text-xs font-bold text-orange-800">{contra}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const DetailSection: React.FC<{ title: string; icon: string; content: string }> = ({ title, icon, content }) => (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <h4 className="text-sm font-black text-slate-800 uppercase mb-2 flex items-center">
            <span className="mr-2">{icon}</span> {title}
        </h4>
        <p className="text-xs font-bold text-slate-700 leading-relaxed">{content}</p>
    </div>
);

// Suggest Medication Card Component
const SuggestMedicationCard: React.FC<{
    drug: DrugDetail;
    sources: string[];
    onAdd: (medication: SuggestedMedication) => void;
    onRemove: (drugName: string) => void;
    existingMedication?: SuggestedMedication;
}> = ({ drug, sources, onAdd, onRemove, existingMedication }) => {
    const [dose, setDose] = useState(existingMedication?.dose || '');
    const [frequency, setFrequency] = useState(existingMedication?.frequency || '');
    const [route, setRoute] = useState(existingMedication?.route || '');
    const [isAdded, setIsAdded] = useState(!!existingMedication);

    const isComplete = dose.trim() !== '' && frequency.trim() !== '' && route.trim() !== '';

    const handleAdd = () => {
        if (isComplete) {
            const primarySource = sources.includes('AI') ? 'AI' : sources.includes('Logic') ? 'Logic' : 'Manual';
            const medication: SuggestedMedication = {
                name: drug.name,
                source: primarySource,
                dose: dose.trim(),
                frequency: frequency.trim(),
                route: route.trim(),
                isComplete: true
            };
            onAdd(medication);
            setIsAdded(true);
        }
    };

    const handleRemove = () => {
        onRemove(drug.name);
        setIsAdded(false);
        setDose('');
        setFrequency('');
        setRoute('');
    };

    return (
        <div className={`bg-white rounded-xl p-4 border-2 transition-all ${isAdded ? 'border-emerald-400 bg-emerald-50' : 'border-emerald-200'
            }`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-sm font-black text-slate-900 capitalize">{drug.name}</h4>
                        <div className="flex gap-1">
                            {sources.map(source => (
                                <span
                                    key={source}
                                    className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${source === 'Manual' ? 'bg-blue-100 text-blue-700' :
                                        source === 'AI' ? 'bg-purple-100 text-purple-700' :
                                            source === 'Logic' ? 'bg-amber-100 text-amber-700' :
                                                'bg-indigo-100 text-indigo-700'
                                        }`}
                                >
                                    {source}
                                </span>
                            ))}
                        </div>
                    </div>
                    <p className="text-xs text-slate-600 font-medium mb-3">
                        <span className="font-black">Indication:</span> {drug.indication}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div>
                    <label className="block text-[8px] font-black text-red-600 uppercase tracking-widest mb-1">
                        Dose *
                    </label>
                    <input
                        type="text"
                        value={dose}
                        onChange={e => setDose(e.target.value)}
                        placeholder="e.g., 500mg"
                        disabled={isAdded}
                        className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:border-emerald-400 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                </div>
                <div>
                    <label className="block text-[8px] font-black text-red-600 uppercase tracking-widest mb-1">
                        Frequency *
                    </label>
                    <select
                        value={frequency}
                        onChange={e => setFrequency(e.target.value)}
                        disabled={isAdded}
                        className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:border-emerald-400 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                        <option value="">Select</option>
                        <option value="QD (Once Daily)">QD (Once Daily)</option>
                        <option value="BID (Twice Daily)">BID (Twice Daily)</option>
                        <option value="TID (Thrice Daily)">TID (Thrice Daily)</option>
                        <option value="QID (4x Daily)">QID (4x Daily)</option>
                        <option value="PRN (As Needed)">PRN (As Needed)</option>
                        <option value="STAT (Immediately)">STAT (Immediately)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[8px] font-black text-red-600 uppercase tracking-widest mb-1">
                        Route *
                    </label>
                    <select
                        value={route}
                        onChange={e => setRoute(e.target.value)}
                        disabled={isAdded}
                        className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:border-emerald-400 focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                        <option value="">Select</option>
                        <option value="Oral">Oral</option>
                        <option value="IV">IV</option>
                        <option value="IM">IM</option>
                        <option value="SC">SC</option>
                        <option value="Sublingual">Sublingual</option>
                        <option value="Topical">Topical</option>
                        <option value="PR">PR</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-[8px] font-medium">
                    {!isComplete && !isAdded && (
                        <span className="text-red-600 font-black">* All fields are mandatory</span>
                    )}
                    {isComplete && !isAdded && (
                        <span className="text-emerald-600 font-black">✓ Ready to add</span>
                    )}
                    {isAdded && (
                        <span className="text-emerald-700 font-black">✓ Added to suggested medications</span>
                    )}
                </div>
                <div className="flex gap-2">
                    {!isAdded ? (
                        <button
                            onClick={handleAdd}
                            disabled={!isComplete}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition ${isComplete
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            Add to Suggestions
                        </button>
                    ) : (
                        <button
                            onClick={handleRemove}
                            className="px-4 py-2 rounded-lg text-[10px] font-black uppercase bg-red-100 text-red-700 hover:bg-red-200 transition"
                        >
                            Remove
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DrugInformationPanel;
