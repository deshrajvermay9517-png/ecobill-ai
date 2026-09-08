"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { INDIAN_REGIONS } from "@/lib/carbon";
import {
  ExtractedBillData,
  getConfidenceTier,
  ConfidenceTier,
} from "@/lib/gemini";

export default function AnalyzePage() {
  const router = useRouter();

  // Active Tab: 'upload' | 'manual'
  const [activeTab, setActiveTab] = useState<"upload" | "manual">("upload");

  // Manual Form States
  const [billingPeriod, setBillingPeriod] = useState<string>("August 2026");
  const [kwhUsage, setKwhUsage] = useState<string>("");
  const [billAmount, setBillAmount] = useState<string>("");
  const [stateRegion, setStateRegion] = useState<string>("national");
  const [householdSize, setHouseholdSize] = useState<string>("3");

  // Validation & Error States for Manual Form
  const [manualErrors, setManualErrors] = useState<{
    kwhUsage?: string;
    billAmount?: string;
    billingPeriod?: string;
  }>({});

  // Upload & Extraction States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedBillData | null>(null);

  // Review / Confirmation Form States (after AI extraction)
  const [reviewPeriod, setReviewPeriod] = useState<string>("");
  const [reviewKwh, setReviewKwh] = useState<string>("");
  const [reviewBill, setReviewBill] = useState<string>("");
  const [reviewRegion, setReviewRegion] = useState<string>("national");
  const [reviewProvider, setReviewProvider] = useState<string>("");
  const [reviewHousehold, setReviewHousehold] = useState<string>("3");
  const [reviewErrors, setReviewErrors] = useState<{
    kwh?: string;
    bill?: string;
    period?: string;
  }>({});

  // Helper to match extracted state string to INDIAN_REGIONS ID
  const matchRegionId = (rawState?: string | null): string => {
    if (!rawState) return "national";
    const lower = rawState.toLowerCase();
    const found = INDIAN_REGIONS.find(
      (r) => lower.includes(r.id) || lower.includes(r.name.toLowerCase().split(" ")[0])
    );
    return found ? found.id : "national";
  };

  // Quick Sample Filler for Manual Mode
  const handleFillSample = () => {
    setBillingPeriod("August 2026");
    setKwhUsage("280");
    setBillAmount("2100");
    setStateRegion("maharashtra");
    setHouseholdSize("3");
    setManualErrors({});
  };

  // Handle Manual Form Submission
  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof manualErrors = {};
    const parsedKwh = parseFloat(kwhUsage);
    const parsedBill = parseFloat(billAmount);

    if (!billingPeriod.trim()) {
      newErrors.billingPeriod = "Billing period is required";
    }

    if (!kwhUsage || isNaN(parsedKwh) || parsedKwh <= 0) {
      newErrors.kwhUsage = "Please enter a valid positive kWh value (e.g. 280)";
    }

    if (!billAmount || isNaN(parsedBill) || parsedBill <= 0) {
      newErrors.billAmount = "Please enter a valid bill amount in ₹ (e.g. 2100)";
    }

    if (Object.keys(newErrors).length > 0) {
      setManualErrors(newErrors);
      return;
    }

    const params = new URLSearchParams({
      kwh: parsedKwh.toString(),
      bill: parsedBill.toString(),
      period: billingPeriod.trim(),
      region: stateRegion,
      household: householdSize,
    });

    router.push(`/results?${params.toString()}`);
  };

  // Handle File Input Selection
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setExtractionError(null);
    setExtractedData(null);
  };

  // Trigger Real Gemini Bill Extraction API
  const handleExtractBill = async () => {
    if (!selectedFile) return;

    setIsExtracting(true);
    setExtractionError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/bill/extract", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const errMsg =
          json.error || `Server responded with error status ${res.status}`;
        setExtractionError(errMsg);
        setIsExtracting(false);
        return;
      }

      const data: ExtractedBillData = json.data;
      setExtractedData(data);

      // Pre-fill editable review fields from extracted data
      setReviewPeriod(data.billingPeriod.value || "August 2026");
      setReviewKwh(
        data.electricityUsageKwh.value !== null
          ? data.electricityUsageKwh.value.toString()
          : ""
      );
      setReviewBill(
        data.billAmountInr.value !== null
          ? data.billAmountInr.value.toString()
          : ""
      );
      setReviewRegion(matchRegionId(data.stateOrRegion.value));
      setReviewProvider(data.providerName || "");
      setReviewErrors({});
    } catch (err) {
      setExtractionError(
        `Network or connection error during extraction: ${
          err instanceof Error ? err.message : String(err)
        }. You can switch to manual entry below.`
      );
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle User Confirmation of Extracted Bill Data
  const handleConfirmAndAnalyze = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof reviewErrors = {};
    const parsedKwh = parseFloat(reviewKwh);
    const parsedBill = parseFloat(reviewBill);

    if (!reviewPeriod.trim()) {
      newErrors.period = "Billing period is required.";
    }

    if (!reviewKwh || isNaN(parsedKwh) || parsedKwh <= 0) {
      newErrors.kwh = "Please provide or verify a positive electricity usage in kWh.";
    }

    if (!reviewBill || isNaN(parsedBill) || parsedBill <= 0) {
      newErrors.bill = "Please provide or verify a positive bill amount in ₹.";
    }

    if (Object.keys(newErrors).length > 0) {
      setReviewErrors(newErrors);
      return;
    }

    // Build URL search parameters for deterministic /results calculation
    const params = new URLSearchParams({
      kwh: parsedKwh.toString(),
      bill: parsedBill.toString(),
      period: reviewPeriod.trim(),
      region: reviewRegion,
      household: reviewHousehold,
    });

    router.push(`/results?${params.toString()}`);
  };

  // Helper badge styles for confidence tiers
  const getConfidenceBadge = (confidence: number) => {
    const tier: ConfidenceTier = getConfidenceTier(confidence);
    switch (tier) {
      case "High":
        return {
          label: "High Confidence",
          badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
        };
      case "Medium":
        return {
          label: "Medium Confidence",
          badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
        };
      case "Low":
      default:
        return {
          label: "Low Confidence",
          badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
        };
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/40 py-10 sm:py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <span>Step 1 of 2: Bill Data Entry</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Analyze Your Electricity Bill
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Upload your utility bill for AI extraction, or enter values manually. All carbon calculations remain 100% deterministic.
          </p>
        </div>

        {/* Main Container Card */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/70 p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab("upload");
                setExtractionError(null);
              }}
              className={`flex-1 py-3 text-center text-sm font-semibold rounded-lg transition-all ${
                activeTab === "upload"
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Upload Bill (AI Extraction)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("manual");
                setExtractionError(null);
              }}
              className={`flex-1 py-3 text-center text-sm font-semibold rounded-lg transition-all ${
                activeTab === "manual"
                  ? "bg-white text-emerald-800 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Enter Manually (Instant Analysis)
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {/* MODE A: UPLOAD BILL */}
            {activeTab === "upload" && (
              <div>
                {/* State 1: Ready to Upload / Staged File */}
                {!extractedData && (
                  <div className="space-y-6">
                    {/* Error Banner if extraction failed */}
                    {extractionError && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4">
                        <div className="flex items-start gap-3">
                          <svg
                            className="h-5 w-5 text-rose-700 shrink-0 mt-0.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <div className="text-xs text-rose-900 space-y-2 flex-1">
                            <p className="font-bold">Extraction Notice</p>
                            <p className="leading-relaxed">{extractionError}</p>
                            <button
                              type="button"
                              onClick={() => {
                                handleFillSample();
                                setActiveTab("manual");
                              }}
                              className="inline-flex items-center gap-1.5 font-bold text-rose-800 underline hover:text-rose-950"
                            >
                              <span>Switch to Manual Entry instead →</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Drag and drop upload zone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleFileSelect(e.dataTransfer.files[0]);
                        }
                      }}
                      className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                        isDragging
                          ? "border-emerald-500 bg-emerald-50/40"
                          : "border-slate-200 bg-slate-50/30 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="file"
                        id="bill-upload-input"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileSelect(e.target.files[0]);
                          }
                        }}
                        className="sr-only"
                      />

                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <svg
                          className="h-6 w-6"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>

                      <p className="mt-4 text-sm font-semibold text-slate-800">
                        Drop your electricity bill here, or{" "}
                        <label
                          htmlFor="bill-upload-input"
                          className="cursor-pointer text-emerald-700 underline hover:text-emerald-800"
                        >
                          browse files
                        </label>
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Supports PDF, JPG, and PNG (maximum 10 MB)
                      </p>

                      {selectedFile && (
                        <div className="mt-5 w-full max-w-md rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 text-left">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <svg
                                className="h-4 w-4 text-emerald-700 shrink-0"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              <span className="truncate text-xs font-semibold text-slate-800">
                                {selectedFile.name}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </div>
                          <p className="mt-2 text-[11px] text-emerald-800">
                            Ready for AI extraction with Gemini. Click below to extract bill details.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Extraction Button */}
                    <div>
                      <button
                        type="button"
                        disabled={!selectedFile || isExtracting}
                        onClick={handleExtractBill}
                        className={`w-full flex items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-semibold text-white shadow-sm transition-all ${
                          !selectedFile || isExtracting
                            ? "bg-slate-300 cursor-not-allowed text-slate-500"
                            : "bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99]"
                        }`}
                      >
                        {isExtracting ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            <span>Extracting Bill Data with Gemini...</span>
                          </>
                        ) : (
                          <>
                            <svg
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                            </svg>
                            <span>Extract Bill Data with AI</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Fallback buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setActiveTab("manual")}
                        className="w-full sm:w-auto text-xs font-semibold text-slate-600 hover:text-slate-900"
                      >
                        Prefer manual entry? Switch to Manual Form →
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleFillSample();
                          setActiveTab("manual");
                        }}
                        className="w-full sm:w-auto text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        + Or Fill with Sample Bill Data
                      </button>
                    </div>
                  </div>
                )}

                {/* State 2: Review Extracted Bill Data (Trust & Confirmation Step) */}
                {extractedData && (
                  <form onSubmit={handleConfirmAndAnalyze} className="space-y-6">
                    {/* Source Labeling & Trust Notice */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                          AI-extracted bill data
                        </span>
                        <span className="text-xs text-slate-500">
                          Review extracted values before analysis.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setExtractedData(null);
                          setSelectedFile(null);
                        }}
                        className="text-xs text-slate-500 hover:text-slate-800 underline"
                      >
                        Upload different file
                      </button>
                    </div>

                    {/* Low Confidence or Missing Fields Warning Banner */}
                    {(extractedData.electricityUsageKwh.value === null ||
                      extractedData.billAmountInr.value === null ||
                      extractedData.electricityUsageKwh.confidence < 0.6 ||
                      extractedData.billAmountInr.confidence < 0.6 ||
                      extractedData.warnings.length > 0) && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
                        <div className="flex items-start gap-3">
                          <svg
                            className="h-5 w-5 text-amber-700 shrink-0 mt-0.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <div className="text-xs text-amber-900 space-y-1">
                            <p className="font-bold">
                              Verification needed on extracted values
                            </p>
                            <p className="leading-relaxed">
                              We couldn&apos;t confidently extract every required value. Please review or enter the missing information manually.
                            </p>
                            {extractedData.warnings.length > 0 && (
                              <ul className="list-disc pl-4 pt-1 space-y-0.5 text-amber-800">
                                {extractedData.warnings.slice(0, 3).map((w, idx) => (
                                  <li key={idx}>{w}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <h2 className="text-base font-bold text-slate-900">
                      Review & Edit Extracted Fields
                    </h2>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      {/* 1. Billing Period Field */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="review-period"
                            className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                          >
                            Billing Period *
                          </label>
                          {extractedData.billingPeriod && (
                            <span
                              className={`rounded border px-1.5 py-0.2 text-[10px] font-bold ${
                                getConfidenceBadge(extractedData.billingPeriod.confidence).badgeClass
                              }`}
                            >
                              {getConfidenceBadge(extractedData.billingPeriod.confidence).label}
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          id="review-period"
                          value={reviewPeriod}
                          onChange={(e) => {
                            setReviewPeriod(e.target.value);
                            if (reviewErrors.period) setReviewErrors({ ...reviewErrors, period: undefined });
                          }}
                          className={`mt-1.5 block w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
                            reviewErrors.period
                              ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                              : "border-slate-200 focus:border-emerald-600 focus:ring-emerald-100"
                          }`}
                        />
                        {extractedData.billingPeriod.evidence && (
                          <p className="mt-1 text-[11px] text-slate-500 italic">
                            Source: &ldquo;{extractedData.billingPeriod.evidence}&rdquo;
                          </p>
                        )}
                        {reviewErrors.period && (
                          <p className="mt-1 text-xs text-rose-600">{reviewErrors.period}</p>
                        )}
                      </div>

                      {/* 2. State / Region Field */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="review-region"
                            className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                          >
                            State / Grid Region
                          </label>
                          {extractedData.stateOrRegion && (
                            <span
                              className={`rounded border px-1.5 py-0.2 text-[10px] font-bold ${
                                getConfidenceBadge(extractedData.stateOrRegion.confidence).badgeClass
                              }`}
                            >
                              {getConfidenceBadge(extractedData.stateOrRegion.confidence).label}
                            </span>
                          )}
                        </div>
                        <select
                          id="review-region"
                          value={reviewRegion}
                          onChange={(e) => setReviewRegion(e.target.value)}
                          className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        >
                          {INDIAN_REGIONS.map((region) => (
                            <option key={region.id} value={region.id}>
                              {region.name} ({region.factor} kg CO₂e/kWh)
                            </option>
                          ))}
                        </select>
                        {extractedData.stateOrRegion.evidence && (
                          <p className="mt-1 text-[11px] text-slate-500 italic">
                            Source: &ldquo;{extractedData.stateOrRegion.evidence}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* 3. Electricity Usage (kWh) */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="review-kwh"
                            className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                          >
                            Electricity Usage (kWh) *
                          </label>
                          {extractedData.electricityUsageKwh && (
                            <span
                              className={`rounded border px-1.5 py-0.2 text-[10px] font-bold ${
                                getConfidenceBadge(extractedData.electricityUsageKwh.confidence).badgeClass
                              }`}
                            >
                              {getConfidenceBadge(extractedData.electricityUsageKwh.confidence).label}
                            </span>
                          )}
                        </div>
                        <div className="relative mt-1.5">
                          <input
                            type="number"
                            id="review-kwh"
                            step="any"
                            min="1"
                            value={reviewKwh}
                            onChange={(e) => {
                              setReviewKwh(e.target.value);
                              if (reviewErrors.kwh) setReviewErrors({ ...reviewErrors, kwh: undefined });
                            }}
                            placeholder="e.g. 280"
                            className={`block w-full rounded-lg border px-3.5 py-2.5 pr-14 text-sm font-mono text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
                              reviewErrors.kwh
                                ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                                : "border-slate-200 focus:border-emerald-600 focus:ring-emerald-100"
                            }`}
                          />
                          <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs font-semibold text-slate-400">
                            kWh
                          </span>
                        </div>
                        {extractedData.electricityUsageKwh.evidence && (
                          <p className="mt-1 text-[11px] text-slate-500 italic">
                            Source: &ldquo;{extractedData.electricityUsageKwh.evidence}&rdquo;
                          </p>
                        )}
                        {reviewErrors.kwh && (
                          <p className="mt-1 text-xs text-rose-600">{reviewErrors.kwh}</p>
                        )}
                      </div>

                      {/* 4. Bill Amount (₹) */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="review-bill"
                            className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                          >
                            Bill Amount (₹) *
                          </label>
                          {extractedData.billAmountInr && (
                            <span
                              className={`rounded border px-1.5 py-0.2 text-[10px] font-bold ${
                                getConfidenceBadge(extractedData.billAmountInr.confidence).badgeClass
                              }`}
                            >
                              {getConfidenceBadge(extractedData.billAmountInr.confidence).label}
                            </span>
                          )}
                        </div>
                        <div className="relative mt-1.5">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs font-semibold text-slate-400">
                            ₹
                          </span>
                          <input
                            type="number"
                            id="review-bill"
                            step="any"
                            min="1"
                            value={reviewBill}
                            onChange={(e) => {
                              setReviewBill(e.target.value);
                              if (reviewErrors.bill) setReviewErrors({ ...reviewErrors, bill: undefined });
                            }}
                            placeholder="e.g. 2100"
                            className={`block w-full rounded-lg border px-3.5 py-2.5 pl-8 text-sm font-mono text-slate-900 transition-colors focus:outline-none focus:ring-2 ${
                              reviewErrors.bill
                                ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                                : "border-slate-200 focus:border-emerald-600 focus:ring-emerald-100"
                            }`}
                          />
                        </div>
                        {extractedData.billAmountInr.evidence && (
                          <p className="mt-1 text-[11px] text-slate-500 italic">
                            Source: &ldquo;{extractedData.billAmountInr.evidence}&rdquo;
                          </p>
                        )}
                        {reviewErrors.bill && (
                          <p className="mt-1 text-xs text-rose-600">{reviewErrors.bill}</p>
                        )}
                      </div>

                      {/* 5. Provider Name (Contextual) */}
                      <div>
                        <label
                          htmlFor="review-provider"
                          className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                        >
                          Provider / DISCOM
                        </label>
                        <input
                          type="text"
                          id="review-provider"
                          value={reviewProvider}
                          onChange={(e) => setReviewProvider(e.target.value)}
                          placeholder="e.g. Tata Power / MSEDCL / BSES"
                          className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                        <p className="mt-1 text-[11px] text-slate-400">
                          Extracted utility provider name.
                        </p>
                      </div>

                      {/* 6. Household Size */}
                      <div>
                        <label
                          htmlFor="review-household"
                          className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                        >
                          Household Benchmark Size
                        </label>
                        <select
                          id="review-household"
                          value={reviewHousehold}
                          onChange={(e) => setReviewHousehold(e.target.value)}
                          className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        >
                          <option value="1">1 Person (Studio / Single)</option>
                          <option value="2">2 People (Couple / Shared)</option>
                          <option value="3">3 People (Small Family)</option>
                          <option value="4">4 People (Standard Family)</option>
                          <option value="5">5+ People (Large Household)</option>
                        </select>
                        <p className="mt-1 text-[11px] text-slate-400">
                          Used to benchmark your usage tier.
                        </p>
                      </div>
                    </div>

                    {/* Architecture Reminder Banner */}
                    <div className="rounded-lg bg-emerald-50/60 border border-emerald-200 p-3.5 text-xs text-emerald-900">
                      <p className="font-semibold">
                        Engineering Principle: AI extracts and explains. Deterministic calculations handle energy and carbon estimates.
                      </p>
                      <p className="mt-1 text-emerald-800">
                        When you click Confirm, these reviewed numbers are processed exclusively by our deterministic calculation engine in <code className="font-mono bg-emerald-100 px-1 py-0.5 rounded">src/lib/carbon.ts</code>.
                      </p>
                    </div>

                    {/* Submit Confirmation Action */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setExtractedData(null);
                          setSelectedFile(null);
                        }}
                        className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        ← Back to Upload
                      </button>

                      <button
                        type="submit"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-800 hover:shadow-md active:scale-[0.99]"
                      >
                        <span>Confirm & Analyze</span>
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* MODE B: ENTER MANUALLY */}
            {activeTab === "manual" && (
              <form onSubmit={handleSubmitManual} className="space-y-6">
                {/* Top quick helper & sample button */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs text-slate-500">
                    Fill the fields from your latest electricity bill statement.
                  </span>
                  <button
                    type="button"
                    onClick={handleFillSample}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    + Load Sample Bill
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* Field 1: Billing Period */}
                  <div>
                    <label
                      htmlFor="billing-period"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                    >
                      Billing Period *
                    </label>
                    <input
                      type="text"
                      id="billing-period"
                      value={billingPeriod}
                      onChange={(e) => {
                        setBillingPeriod(e.target.value);
                        if (manualErrors.billingPeriod) setManualErrors({ ...manualErrors, billingPeriod: undefined });
                      }}
                      placeholder="e.g. August 2026"
                      className={`mt-1.5 block w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                        manualErrors.billingPeriod
                          ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                          : "border-slate-200 focus:border-emerald-600 focus:ring-emerald-100"
                      }`}
                    />
                    {manualErrors.billingPeriod ? (
                      <p className="mt-1 text-xs text-rose-600">{manualErrors.billingPeriod}</p>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-400">Month and year of this billing cycle.</p>
                    )}
                  </div>

                  {/* Field 2: State / Region */}
                  <div>
                    <label
                      htmlFor="state-region"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                    >
                      State / Grid Region
                    </label>
                    <select
                      id="state-region"
                      value={stateRegion}
                      onChange={(e) => setStateRegion(e.target.value)}
                      className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    >
                      {INDIAN_REGIONS.map((region) => (
                        <option key={region.id} value={region.id}>
                          {region.name} ({region.factor} kg CO₂e/kWh)
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Determines the regional grid emission factor.
                    </p>
                  </div>

                  {/* Field 3: Electricity Usage (kWh) */}
                  <div>
                    <label
                      htmlFor="kwh-usage"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                    >
                      Electricity Usage (kWh) *
                    </label>
                    <div className="relative mt-1.5">
                      <input
                        type="number"
                        id="kwh-usage"
                        step="any"
                        min="1"
                        value={kwhUsage}
                        onChange={(e) => {
                          setKwhUsage(e.target.value);
                          if (manualErrors.kwhUsage) setManualErrors({ ...manualErrors, kwhUsage: undefined });
                        }}
                        placeholder="e.g. 280"
                        className={`block w-full rounded-lg border px-3.5 py-2.5 pr-14 text-sm font-mono text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                          manualErrors.kwhUsage
                            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                            : "border-slate-200 focus:border-emerald-600 focus:ring-emerald-100"
                        }`}
                      />
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs font-semibold text-slate-400">
                        kWh
                      </span>
                    </div>
                    {manualErrors.kwhUsage ? (
                      <p className="mt-1 text-xs text-rose-600">{manualErrors.kwhUsage}</p>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-400">Total units consumed this cycle.</p>
                    )}
                  </div>

                  {/* Field 4: Bill Amount (₹) */}
                  <div>
                    <label
                      htmlFor="bill-amount"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                    >
                      Bill Amount (₹) *
                    </label>
                    <div className="relative mt-1.5">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-xs font-semibold text-slate-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        id="bill-amount"
                        step="any"
                        min="1"
                        value={billAmount}
                        onChange={(e) => {
                          setBillAmount(e.target.value);
                          if (manualErrors.billAmount) setManualErrors({ ...manualErrors, billAmount: undefined });
                        }}
                        placeholder="e.g. 2100"
                        className={`block w-full rounded-lg border px-3.5 py-2.5 pl-8 text-sm font-mono text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                          manualErrors.billAmount
                            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                            : "border-slate-200 focus:border-emerald-600 focus:ring-emerald-100"
                        }`}
                      />
                    </div>
                    {manualErrors.billAmount ? (
                      <p className="mt-1 text-xs text-rose-600">{manualErrors.billAmount}</p>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-400">Total amount payable on bill.</p>
                    )}
                  </div>

                  {/* Field 5: Household Size */}
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="household-size"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                    >
                      Household Benchmark Size
                    </label>
                    <select
                      id="household-size"
                      value={householdSize}
                      onChange={(e) => setHouseholdSize(e.target.value)}
                      className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-colors focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="1">1 Person (Studio / Single Resident)</option>
                      <option value="2">2 People (Couple / Shared)</option>
                      <option value="3">3 People (Small Family)</option>
                      <option value="4">4 People (Standard Family)</option>
                      <option value="5">5+ People (Large Household)</option>
                    </select>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Helps benchmark whether your per-capita usage is Low, Moderate, or High.
                    </p>
                  </div>
                </div>

                {/* Privacy Note */}
                <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3.5 flex items-center gap-2.5 text-xs text-slate-600">
                  <svg
                    className="h-4 w-4 text-emerald-600 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>
                    <strong>Privacy note:</strong> Manual usage calculations are processed in the browser. Uploaded bills are sent only to the server-side extraction endpoint for analysis and are not used by the deterministic carbon calculation engine until the user reviews and confirms the extracted values.
                  </span>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-700 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-800 hover:shadow-md active:scale-[0.99]"
                  >
                    <span>Analyze Usage</span>
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
