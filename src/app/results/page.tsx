"use client";

import React, { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import MetricCard from "@/components/MetricCard";
import {
  calculateBillMetrics,
  calculateReductionScenario,
  DEFAULT_GRID_EMISSION_FACTOR_KG_CO2_PER_KWH,
  INDIAN_REGIONS,
} from "@/lib/carbon";
import type { PersonalizedRecommendation } from "@/lib/gemini";

function ResultsContent() {
  const searchParams = useSearchParams();

  // Read query parameters with realistic defaults for testing or direct navigation
  const rawKwh = searchParams.get("kwh");
  const rawBill = searchParams.get("bill");
  const period = searchParams.get("period") || "August 2026";
  const regionId = searchParams.get("region") || "national";
  const rawHousehold = searchParams.get("household");

  const kwh = rawKwh ? parseFloat(rawKwh) : 280;
  const bill = rawBill ? parseFloat(rawBill) : 2100;
  const householdSize = rawHousehold ? parseInt(rawHousehold, 10) : 3;

  // Selected reduction scenario: 5%, 10%, 15%, 20%
  const [selectedPercentage, setSelectedPercentage] = useState<number>(15);

  // Identify regional emission factor
  const selectedRegion = useMemo(() => {
    return (
      INDIAN_REGIONS.find((r) => r.id === regionId) || {
        id: "national",
        name: "National Grid Baseline",
        factor: DEFAULT_GRID_EMISSION_FACTOR_KG_CO2_PER_KWH,
      }
    );
  }, [regionId]);

  // Deterministic calculations
  const metrics = useMemo(() => {
    return calculateBillMetrics(kwh, bill, selectedRegion.factor, householdSize);
  }, [kwh, bill, selectedRegion.factor, householdSize]);

  // Reduction scenario calculations
  const scenario = useMemo(() => {
    return calculateReductionScenario(kwh, bill, selectedPercentage, selectedRegion.factor);
  }, [kwh, bill, selectedPercentage, selectedRegion.factor]);

  const reductionOptions = [5, 10, 15, 20];

  // Personalized AI Recommendations State
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[] | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState<boolean>(true);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [recommendationModel, setRecommendationModel] = useState<string>("gemini-3.5-flash-lite");

  const fetchRecommendations = useCallback(async () => {
    setIsLoadingRecommendations(true);
    setRecommendationError(null);

    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthlyElectricityUsageKwh: metrics.monthlyKwh,
          householdSize,
          stateOrRegion: selectedRegion.name,
          usageTier: metrics.classification.tier,
          effectiveTariff: metrics.effectiveRatePerKwh,
          selectedReductionTarget: selectedPercentage,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate recommendations.");
      }

      setRecommendations(data.recommendations || []);
      if (data.modelUsed) {
        setRecommendationModel(data.modelUsed);
      }
    } catch (err) {
      setRecommendationError(
        err instanceof Error ? err.message : "Unable to load personalized recommendations."
      );
    } finally {
      setIsLoadingRecommendations(false);
    }
  }, [
    metrics.monthlyKwh,
    metrics.classification.tier,
    metrics.effectiveRatePerKwh,
    householdSize,
    selectedRegion.name,
    selectedPercentage,
  ]);

  useEffect(() => {
    let ignore = false;
    fetch("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        monthlyElectricityUsageKwh: metrics.monthlyKwh,
        householdSize,
        stateOrRegion: selectedRegion.name,
        usageTier: metrics.classification.tier,
        effectiveTariff: metrics.effectiveRatePerKwh,
        selectedReductionTarget: selectedPercentage,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (ignore) return;
        if (data.success && data.recommendations) {
          setRecommendations(data.recommendations);
          if (data.modelUsed) {
            setRecommendationModel(data.modelUsed);
          }
        } else {
          setRecommendationError(data.error || "Unable to load personalized recommendations.");
        }
      })
      .catch((err) => {
        if (ignore) return;
        setRecommendationError(
          err instanceof Error ? err.message : "Unable to load personalized recommendations."
        );
      })
      .finally(() => {
        if (ignore) return;
        setIsLoadingRecommendations(false);
      });

    return () => {
      ignore = true;
    };
  }, [
    metrics.monthlyKwh,
    metrics.classification.tier,
    metrics.effectiveRatePerKwh,
    householdSize,
    selectedRegion.name,
    selectedPercentage,
  ]);


  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/40 py-10 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Top Header & Context */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                Deterministic Analysis
              </span>
              <span className="text-xs text-slate-500">
                Period: <strong className="text-slate-800">{period}</strong>
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              Energy & Carbon Impact Report
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Grid region: <strong className="text-slate-700">{selectedRegion.name}</strong> ({selectedRegion.factor} kg CO₂e/kWh baseline)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/analyze"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 shadow-2xs"
            >
              <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Edit Usage Data</span>
            </Link>
          </div>
        </div>

        {/* Section 1: Deterministic Metrics Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">
              Monthly Consumption & Footprint Baseline
            </h2>
            <span className="text-xs text-slate-500">
              Formula: Usage (kWh) × Emission Factor ({selectedRegion.factor} kg CO₂e/kWh)
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Metric 1: Monthly Usage */}
            <MetricCard
              title="Monthly Usage"
              value={metrics.monthlyKwh}
              unit="kWh"
              subtitle="Total electricity units consumed"
              footnote={`Effective: ₹${metrics.effectiveRatePerKwh}/kWh`}
              icon={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              }
            />

            {/* Metric 2: Bill Amount */}
            <MetricCard
              title="Monthly Bill"
              value={`₹${metrics.monthlyBill.toLocaleString()}`}
              subtitle="Payable amount for this cycle"
              footnote={`Est. Annual: ₹${metrics.annualBill.toLocaleString()}`}
              icon={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              }
            />

            {/* Metric 3: Estimated Carbon Emissions */}
            <MetricCard
              title="Carbon Emissions"
              value={metrics.monthlyCarbonKg}
              unit="kg CO₂e"
              subtitle="Greenhouse gas footprint from power"
              badge={{
                text: `${metrics.annualCarbonTonnes} tonnes / yr`,
                variant: "emerald",
              }}
              footnote={`${metrics.monthlyKwh} × ${metrics.gridFactorUsed}`}
              icon={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 20A7 7 0 0 1 4 13a8 8 0 0 1 8-8c5.5 0 9 3.5 9 9a7 7 0 0 1-7 7Z" />
                </svg>
              }
            />

            {/* Metric 4: Annualized Electricity Use */}
            <MetricCard
              title="Annual Projection"
              value={metrics.annualKwh.toLocaleString()}
              unit="kWh / yr"
              subtitle="Projected 12-month baseline"
              badge={{
                text: `${metrics.annualCarbonKg.toLocaleString()} kg CO₂e`,
                variant: "blue",
              }}
              footnote="Assumes standard monthly run-rate"
              icon={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              }
            />
          </div>

          {/* Usage Classification Card */}
          <div
            className={`mt-4 rounded-xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${metrics.classification.bgClass} ${metrics.classification.borderClass}`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Residential Benchmark Tier:
                </span>
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${metrics.classification.colorClass}`}
                >
                  {metrics.classification.label}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700">
                {metrics.classification.description} (Evaluated for {householdSize}-person household benchmark).
              </p>
            </div>

            <div className="shrink-0 text-left sm:text-right">
              <span className="text-xs text-slate-500 block">Baseline Classification</span>
              <span className="font-mono text-sm font-bold text-slate-800">
                {metrics.classification.tier} Consumption
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Deterministic Reduction Simulator */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900">
                  Reduction Simulator
                </h2>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                Explore immediate impacts on power bills and greenhouse gases with realistic efficiency targets.
              </p>
            </div>

            {/* Selection Buttons */}
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1">
              {reductionOptions.map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setSelectedPercentage(pct)}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                    selectedPercentage === pct
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-slate-600 hover:bg-white hover:text-slate-900"
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Simulator Results Output */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Box 1: Electricity Saved */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Electricity Saved
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">
                  {scenario.kwhSavedMonthly}
                </span>
                <span className="text-sm font-semibold text-slate-600">kWh / mo</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Annual reduction: <strong>{scenario.kwhSavedAnnual} kWh</strong>
              </p>
              <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 font-mono">
                New usage: {scenario.newMonthlyKwh} kWh/mo
              </div>
            </div>

            {/* Box 2: Bill Savings */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Estimated Bill Savings
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-emerald-900 font-mono">
                  ₹{scenario.billSavedMonthly.toLocaleString()}
                </span>
                <span className="text-sm font-semibold text-emerald-800">/ mo</span>
              </div>
              <p className="mt-2 text-xs text-emerald-700">
                Annual savings: <strong>₹{scenario.billSavedAnnual.toLocaleString()}</strong>
              </p>
              <div className="mt-3 pt-2 border-t border-emerald-200/60 text-[11px] text-emerald-800 font-mono">
                Effective tariff: ₹{metrics.effectiveRatePerKwh}/kWh
              </div>
            </div>

            {/* Box 3: Carbon Abatement */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                CO₂e Abatement
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-slate-900 font-mono">
                  {scenario.carbonSavedKgMonthly}
                </span>
                <span className="text-sm font-semibold text-slate-600">kg CO₂e / mo</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Annual abatement: <strong>{scenario.carbonSavedKgAnnual} kg CO₂e</strong>
              </p>
              <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] text-emerald-800 font-medium">
                ~{scenario.equivalentTreesPlanted} mature tree absorption equivalents / yr
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-[11px] text-slate-500 border border-slate-100 flex items-center justify-between">
            <span>Calculations are strictly deterministic (Usage × {selectedPercentage}% × ₹{metrics.effectiveRatePerKwh}/kWh).</span>
            <span className="font-semibold text-emerald-700">Deterministic carbon math</span>
          </div>
        </div>

        {/* Section 3: Personalized Action Plan (Live Gemini-Powered) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs relative overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                  Personalized AI actions — active
                </span>
                <h2 className="text-lg font-bold text-slate-900">
                  Your Personalized Action Plan
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">
                Actionable reduction steps tailored to your {metrics.classification.tier.toLowerCase()} consumption profile ({metrics.monthlyKwh} kWh) and {selectedPercentage}% target.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 border border-emerald-200/60">
                <svg className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                </svg>
                <span>Powered by {recommendationModel}</span>
              </div>
              <button
                type="button"
                onClick={() => fetchRecommendations()}
                disabled={isLoadingRecommendations}
                title="Regenerate recommendations"
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <svg className={`h-3.5 w-3.5 ${isLoadingRecommendations ? "animate-spin text-emerald-600" : "text-slate-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
              </button>
            </div>
          </div>

          {/* Loading Skeleton State */}
          {isLoadingRecommendations && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
                <span>Generating practical reduction actions tailored to your consumption...</span>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 animate-pulse space-y-3">
                    <div className="flex justify-between">
                      <div className="h-3 w-20 bg-slate-200 rounded" />
                      <div className="h-3 w-12 bg-slate-200 rounded" />
                    </div>
                    <div className="h-4 w-3/4 bg-slate-200 rounded" />
                    <div className="h-3 w-full bg-slate-200 rounded" />
                    <div className="h-3 w-5/6 bg-slate-200 rounded" />
                    <div className="h-8 w-full bg-slate-200 rounded mt-4" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {!isLoadingRecommendations && recommendationError && (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50/60 p-4 text-xs text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <svg className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div>
                  <p className="font-semibold">Unable to load recommendations</p>
                  <p className="text-rose-700 mt-0.5">{recommendationError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => fetchRecommendations()}
                className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 transition-colors shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {/* Active Recommendation Cards */}
          {!isLoadingRecommendations && !recommendationError && recommendations && recommendations.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {recommendations.map((rec) => {
                const priorityColors: Record<string, string> = {
                  high: "bg-rose-50 text-rose-700 border-rose-200",
                  medium: "bg-amber-50 text-amber-700 border-amber-200",
                  low: "bg-slate-100 text-slate-700 border-slate-200",
                };
                const priorityClass = priorityColors[rec.priority] || "bg-slate-100 text-slate-700 border-slate-200";

                const effortColors: Record<string, string> = {
                  low: "bg-emerald-50 text-emerald-800 border-emerald-200",
                  medium: "bg-blue-50 text-blue-800 border-blue-200",
                  high: "bg-purple-50 text-purple-800 border-purple-200",
                };
                const effortClass = effortColors[rec.effort] || "bg-slate-50 text-slate-700 border-slate-200";

                return (
                  <div
                    key={rec.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/40 p-4 transition-all hover:border-emerald-300 hover:bg-white hover:shadow-xs"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                          {rec.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${priorityClass}`}>
                            {rec.priority} priority
                          </span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${effortClass}`}>
                            {rec.effort} effort
                          </span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{rec.title}</h3>
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed">{rec.whyItMatches}</p>
                      </div>

                      {rec.actionSteps && rec.actionSteps.length > 0 && (
                        <div className="pt-1">
                          <span className="text-[11px] font-semibold text-slate-700 block mb-1">Recommended steps:</span>
                          <ul className="space-y-1">
                            {rec.actionSteps.map((step, idx) => (
                              <li key={idx} className="flex items-start gap-1.5 text-xs text-slate-600">
                                <span className="text-emerald-600 font-bold shrink-0">•</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/70 space-y-2">
                      <div className="rounded-md bg-white border border-slate-200/80 p-2 text-xs">
                        <span className="font-semibold text-slate-700 block text-[10px] uppercase tracking-wide">
                          Expected Impact
                        </span>
                        <span className="text-emerald-800 font-medium">{rec.expectedImpact}</span>
                      </div>

                      {rec.caution && (
                        <div className="rounded-md bg-amber-50/80 border border-amber-200/60 p-2 text-[11px] text-amber-800 flex items-start gap-1.5">
                          <svg className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <span>{rec.caution}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Architectural transparency note */}
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600 flex items-start gap-2.5">
            <svg className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <div>
              <p className="font-semibold text-slate-800">Deterministic Architecture Boundary:</p>
              <p className="mt-0.5 text-slate-600 leading-relaxed">
                Gemini recommends actions. Deterministic calculations remain responsible for carbon and savings estimates.
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Methodology & Disclaimer Callout */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-xs text-slate-600 space-y-2">
          <h4 className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
            Calculation Transparency & Reference Sources
          </h4>
          <p className="leading-relaxed">
            • <strong>Carbon Math:</strong> <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">Carbon (kg CO₂e) = Usage (kWh) × Grid Emission Factor ({selectedRegion.factor} kg CO₂e/kWh)</code>.
          </p>
          <p className="leading-relaxed">
            • <strong>Data Source:</strong> Emission baseline calibrated using the Central Electricity Authority (CEA) of India Baseline Carbon Database Version 19. Note: this factor serves as a reference baseline and will be source-verified before final submission.
          </p>
          <p className="leading-relaxed">
            • <strong>Bill Savings:</strong> Calculated as a direct linear fraction of the billing amount using your effective tariff rate of <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">₹{metrics.effectiveRatePerKwh}/kWh</code>. Exact slab benefits may vary by local DISCOM tariff orders.
          </p>
        </div>

        {/* Footer CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <Link
            href="/analyze"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← Analyze Another Bill
          </Link>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-800 shadow-xs"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50/50">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
            <p className="text-xs font-medium text-slate-600">Calculating deterministic impact metrics...</p>
          </div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
