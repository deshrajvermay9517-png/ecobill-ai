/**
 * EcoBill AI - Deterministic Carbon & Energy Calculation Engine
 *
 * NOTE ON EMISSION FACTOR:
 * The constant below is a REFERENCE / PLACEHOLDER emission factor based on
 * the Central Electricity Authority (CEA) of India CO2 Baseline Database
 * for the national grid (~0.71-0.75 kg CO2/kWh weighted average).
 *
 * This value MUST be verified / calibrated against regional grid mix data
 * or user location before final production submission.
 * All calculations here are strictly deterministic and separated from UI/AI logic.
 */

export const DEFAULT_GRID_EMISSION_FACTOR_KG_CO2_PER_KWH = 0.72;

/**
 * List of supported states/regions for regional context.
 * In later phases, regional grid emission factors can replace the default.
 */
export const INDIAN_REGIONS = [
  { id: "national", name: "National Grid Baseline (Default)", factor: DEFAULT_GRID_EMISSION_FACTOR_KG_CO2_PER_KWH },
  { id: "delhi", name: "Delhi (Northern Grid)", factor: 0.73 },
  { id: "maharashtra", name: "Maharashtra (Western Grid)", factor: 0.75 },
  { id: "karnataka", name: "Karnataka (Southern Grid)", factor: 0.68 },
  { id: "tamil-nadu", name: "Tamil Nadu (Southern Grid)", factor: 0.70 },
  { id: "telangana", name: "Telangana (Southern Grid)", factor: 0.71 },
  { id: "gujarat", name: "Gujarat (Western Grid)", factor: 0.74 },
  { id: "west-bengal", name: "West Bengal (Eastern Grid)", factor: 0.78 },
  { id: "kerala", name: "Kerala (Southern Grid)", factor: 0.65 },
  { id: "other", name: "Other State / Union Territory", factor: DEFAULT_GRID_EMISSION_FACTOR_KG_CO2_PER_KWH },
] as const;

export type UsageTier = "Low" | "Moderate" | "High";

export interface UsageClassification {
  tier: UsageTier;
  label: string;
  description: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

export interface BillMetrics {
  monthlyKwh: number;
  monthlyBill: number;
  effectiveRatePerKwh: number;
  monthlyCarbonKg: number;
  annualKwh: number;
  annualBill: number;
  annualCarbonKg: number;
  annualCarbonTonnes: number;
  classification: UsageClassification;
  gridFactorUsed: number;
}

export interface ReductionScenario {
  percentage: number;
  kwhSavedMonthly: number;
  kwhSavedAnnual: number;
  billSavedMonthly: number;
  billSavedAnnual: number;
  carbonSavedKgMonthly: number;
  carbonSavedKgAnnual: number;
  newMonthlyKwh: number;
  newMonthlyBill: number;
  newMonthlyCarbonKg: number;
  equivalentTreesPlanted: number;
}

/**
 * Calculates carbon emissions in kilograms of CO2 equivalent (kg CO2e)
 * Formula: Usage (kWh) * Grid Emission Factor (kg CO2e/kWh)
 */
export function calculateCarbonEmission(
  kwh: number,
  gridFactor: number = DEFAULT_GRID_EMISSION_FACTOR_KG_CO2_PER_KWH
): number {
  if (kwh <= 0 || isNaN(kwh)) return 0;
  return Number((kwh * gridFactor).toFixed(2));
}

/**
 * Classifies monthly consumption based on urban Indian household benchmarks.
 *
 * Typical benchmarks:
 * - Low (<150 kWh/mo): Basic lighting, fans, LED TV, small refrigerator.
 * - Moderate (150-350 kWh/mo): Standard 2-4 person home with basic AC/appliances.
 * - High (>350 kWh/mo): High AC utilization, multi-appliance, large home.
 */
export function classifyUsage(kwh: number, householdSize: number = 3): UsageClassification {
  // Normalize threshold slightly by household size if provided
  const baseModifier = householdSize > 4 ? 1.25 : householdSize <= 1 ? 0.75 : 1.0;
  const lowThreshold = 150 * baseModifier;
  const highThreshold = 350 * baseModifier;

  if (kwh < lowThreshold) {
    return {
      tier: "Low",
      label: "Low Consumption",
      description: `Well within energy-efficient baselines for a ${householdSize}-person household.`,
      colorClass: "text-emerald-700",
      bgClass: "bg-emerald-50",
      borderClass: "border-emerald-200",
    };
  }

  if (kwh <= highThreshold) {
    return {
      tier: "Moderate",
      label: "Moderate Consumption",
      description: `Typical urban consumption pattern with regular household appliances.`,
      colorClass: "text-amber-700",
      bgClass: "bg-amber-50",
      borderClass: "border-amber-200",
    };
  }

  return {
    tier: "High",
    label: "High Consumption",
    description: `Above average usage; significant potential for targeted efficiency and savings.`,
    colorClass: "text-rose-700",
    bgClass: "bg-rose-50",
    borderClass: "border-rose-200",
  };
}

/**
 * Computes all core deterministic bill metrics from manual inputs.
 */
export function calculateBillMetrics(
  kwh: number,
  billAmount: number,
  gridFactor: number = DEFAULT_GRID_EMISSION_FACTOR_KG_CO2_PER_KWH,
  householdSize: number = 3
): BillMetrics {
  const safeKwh = Math.max(0, kwh || 0);
  const safeBill = Math.max(0, billAmount || 0);

  const effectiveRate = safeKwh > 0 ? safeBill / safeKwh : 0;
  const monthlyCarbonKg = calculateCarbonEmission(safeKwh, gridFactor);

  const annualKwh = safeKwh * 12;
  const annualBill = safeBill * 12;
  const annualCarbonKg = Number((monthlyCarbonKg * 12).toFixed(2));
  const annualCarbonTonnes = Number((annualCarbonKg / 1000).toFixed(2));

  const classification = classifyUsage(safeKwh, householdSize);

  return {
    monthlyKwh: safeKwh,
    monthlyBill: safeBill,
    effectiveRatePerKwh: Number(effectiveRate.toFixed(2)),
    monthlyCarbonKg,
    annualKwh,
    annualBill,
    annualCarbonKg,
    annualCarbonTonnes,
    classification,
    gridFactorUsed: gridFactor,
  };
}

/**
 * Calculates savings for a given reduction percentage (e.g., 5%, 10%, 15%, 20%)
 * Uses user's effective tariff (₹/kWh) to estimate realistic financial savings.
 */
export function calculateReductionScenario(
  kwh: number,
  billAmount: number,
  reductionPercentage: number,
  gridFactor: number = DEFAULT_GRID_EMISSION_FACTOR_KG_CO2_PER_KWH
): ReductionScenario {
  const safeKwh = Math.max(0, kwh || 0);
  const safeBill = Math.max(0, billAmount || 0);
  const fraction = Math.max(0, Math.min(100, reductionPercentage)) / 100;

  const kwhSavedMonthly = Number((safeKwh * fraction).toFixed(1));
  const kwhSavedAnnual = Number((kwhSavedMonthly * 12).toFixed(1));

  // Financial savings estimated via proportional bill reduction (effective rate)
  const billSavedMonthly = Number((safeBill * fraction).toFixed(0));
  const billSavedAnnual = billSavedMonthly * 12;

  // Carbon savings
  const carbonSavedKgMonthly = calculateCarbonEmission(kwhSavedMonthly, gridFactor);
  const carbonSavedKgAnnual = Number((carbonSavedKgMonthly * 12).toFixed(1));

  // Real-world equivalency benchmark: 1 mature tree absorbs ~21.77 kg CO2/year (EPA estimate)
  const equivalentTreesPlanted = Math.max(1, Math.round(carbonSavedKgAnnual / 22));

  return {
    percentage: reductionPercentage,
    kwhSavedMonthly,
    kwhSavedAnnual,
    billSavedMonthly,
    billSavedAnnual,
    carbonSavedKgMonthly,
    carbonSavedKgAnnual,
    newMonthlyKwh: Number((safeKwh - kwhSavedMonthly).toFixed(1)),
    newMonthlyBill: Math.max(0, safeBill - billSavedMonthly),
    newMonthlyCarbonKg: Number((calculateCarbonEmission(safeKwh, gridFactor) - carbonSavedKgMonthly).toFixed(2)),
    equivalentTreesPlanted,
  };
}
