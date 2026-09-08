import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  getConfidenceTier,
  validateAndNormalizeExtraction,
} from "./gemini";
import {
  calculateBillMetrics,
  calculateReductionScenario,
  DEFAULT_GRID_EMISSION_FACTOR_KG_CO2_PER_KWH,
} from "./carbon";

// File validation helper functions mirrored from route logic for pure unit testing
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function validateUploadFile(mimeType: string, sizeBytes: number): { valid: boolean; error?: string } {
  if (sizeBytes === 0) {
    return { valid: false, error: "Uploaded file is empty (0 bytes)." };
  }
  if (sizeBytes > MAX_FILE_SIZE) {
    return { valid: false, error: "File size exceeds 10 MB limit." };
  }
  if (!ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) {
    return { valid: false, error: "Unsupported file type." };
  }
  return { valid: true };
}

describe("EcoBill AI Bill Extraction & Integration Tests", () => {
  // 1. Allowed File Types
  test("accepts valid PDF, JPEG, and PNG MIME types", () => {
    assert.equal(validateUploadFile("application/pdf", 1024).valid, true);
    assert.equal(validateUploadFile("image/jpeg", 2048).valid, true);
    assert.equal(validateUploadFile("image/png", 4096).valid, true);
  });

  // 2. Rejected File Types
  test("rejects unsupported MIME types cleanly", () => {
    const invalidTypes = ["text/plain", "application/zip", "image/gif", "video/mp4", "application/octet-stream"];
    for (const mime of invalidTypes) {
      const res = validateUploadFile(mime, 1024);
      assert.equal(res.valid, false);
      assert.match(res.error || "", /Unsupported file type/);
    }
  });

  // 3. File Size Validation
  test("validates file size limits correctly (rejects 0 bytes and >10MB)", () => {
    // 0 bytes
    assert.equal(validateUploadFile("application/pdf", 0).valid, false);
    assert.match(validateUploadFile("application/pdf", 0).error || "", /empty/);

    // Within limit: 5 MB
    assert.equal(validateUploadFile("application/pdf", 5 * 1024 * 1024).valid, true);

    // Exactly 10 MB
    assert.equal(validateUploadFile("application/pdf", 10 * 1024 * 1024).valid, true);

    // Exceeds 10 MB (10MB + 1 byte)
    assert.equal(validateUploadFile("application/pdf", 10 * 1024 * 1024 + 1).valid, false);
    assert.match(validateUploadFile("application/pdf", 10 * 1024 * 1024 + 1).error || "", /exceeds 10 MB/);
  });

  // 4. Valid Structured Extraction Response
  test("correctly parses and normalizes a complete structured Gemini response", () => {
    const mockGeminiOutput = {
      billingPeriod: {
        value: "August 2026",
        confidence: 0.95,
        evidence: "Billing Cycle: 01-08-2026 to 31-08-2026",
      },
      electricityUsageKwh: {
        value: 280,
        confidence: 0.92,
        evidence: "Total Consumption: 280 Units (kWh)",
      },
      billAmountInr: {
        value: 2100,
        confidence: 0.98,
        evidence: "Net Payable: Rs. 2,100.00",
      },
      stateOrRegion: {
        value: "Maharashtra",
        confidence: 0.88,
        evidence: "MSEDCL Mumbai Circle",
      },
      providerName: "MSEDCL",
      accountOrConsumerNumberMasked: "12345678",
      dueDate: "15-Sep-2026",
      warnings: [],
    };

    const normalized = validateAndNormalizeExtraction(mockGeminiOutput);

    assert.equal(normalized.billingPeriod.value, "August 2026");
    assert.equal(normalized.billingPeriod.confidence, 0.95);
    assert.equal(normalized.electricityUsageKwh.value, 280);
    assert.equal(normalized.billAmountInr.value, 2100);
    assert.equal(normalized.stateOrRegion.value, "Maharashtra");
    assert.equal(normalized.providerName, "MSEDCL");
    assert.equal(normalized.accountOrConsumerNumberMasked, "••••••••5678"); // Masks account number
  });

  // 5. Malformed AI Response Handling
  test("handles malformed, null, or empty AI responses safely without throwing", () => {
    const emptyNormalized = validateAndNormalizeExtraction(null);
    assert.equal(emptyNormalized.electricityUsageKwh.value, null);
    assert.equal(emptyNormalized.billAmountInr.value, null);
    assert.ok(emptyNormalized.warnings.length > 0);

    const nonObjectNormalized = validateAndNormalizeExtraction("random text string");
    assert.equal(nonObjectNormalized.electricityUsageKwh.value, null);
    assert.ok(nonObjectNormalized.warnings.length > 0);
  });

  // 6. Missing Critical Fields
  test("flags missing critical fields and appends clear warnings", () => {
    const partialOutput = {
      billingPeriod: {
        value: "July 2026",
        confidence: 0.9,
        evidence: "Cycle: July 2026",
      },
      electricityUsageKwh: {
        value: null,
        confidence: 0.0,
        evidence: null,
      },
      billAmountInr: {
        value: null,
        confidence: 0.0,
        evidence: null,
      },
      stateOrRegion: {
        value: "Delhi",
        confidence: 0.8,
        evidence: "BSES Yamuna",
      },
    };

    const normalized = validateAndNormalizeExtraction(partialOutput);

    assert.equal(normalized.electricityUsageKwh.value, null);
    assert.equal(normalized.billAmountInr.value, null);
    // Warnings should explicitly alert the user to fill/verify missing fields
    const warningText = normalized.warnings.join(" ");
    assert.match(warningText, /usage/i);
    assert.match(warningText, /amount/i);
  });

  // 7. Confidence Label Calculation
  test("calculates confidence tiers correctly (High >= 0.85, Medium 0.60-0.84, Low < 0.60)", () => {
    assert.equal(getConfidenceTier(0.95), "High");
    assert.equal(getConfidenceTier(0.85), "High");
    assert.equal(getConfidenceTier(0.84), "Medium");
    assert.equal(getConfidenceTier(0.70), "Medium");
    assert.equal(getConfidenceTier(0.60), "Medium");
    assert.equal(getConfidenceTier(0.59), "Low");
    assert.equal(getConfidenceTier(0.20), "Low");
    assert.equal(getConfidenceTier(0.0), "Low");
  });

  // 8. User-Confirmed Values Feed Deterministic Calculations
  test("feeds user-confirmed extracted values directly into deterministic calculation engine", () => {
    // Extracted values confirmed by user
    const confirmedKwh = 280;
    const confirmedBill = 2100;
    const gridFactor = DEFAULT_GRID_EMISSION_FACTOR_KG_CO2_PER_KWH; // 0.72

    const metrics = calculateBillMetrics(confirmedKwh, confirmedBill, gridFactor, 3);

    // Verifications:
    // Carbon: 280 * 0.72 = 201.6 kg CO2e
    assert.equal(metrics.monthlyCarbonKg, 201.6);
    // Effective Rate: 2100 / 280 = 7.50 ₹/kWh
    assert.equal(metrics.effectiveRatePerKwh, 7.5);
    // Annualized Usage: 280 * 12 = 3360 kWh
    assert.equal(metrics.annualKwh, 3360);
    // Annualized Carbon: 201.6 * 12 = 2419.2 kg
    assert.equal(metrics.annualCarbonKg, 2419.2);

    // Reduction scenario: 15%
    const reduction15 = calculateReductionScenario(confirmedKwh, confirmedBill, 15, gridFactor);
    // Saved kWh: 280 * 0.15 = 42 kWh
    assert.equal(reduction15.kwhSavedMonthly, 42);
    // Saved Bill: 2100 * 0.15 = 315 ₹
    assert.equal(reduction15.billSavedMonthly, 315);
    // Saved Carbon: 42 * 0.72 = 30.24 kg
    assert.equal(reduction15.carbonSavedKgMonthly, 30.24);
  });

  // 9. No Gemini Call Required for Manual-Entry Flow
  test("manual-entry flow executes without touching Gemini or requiring an API key", () => {
    // Completely standalone without environment variables
    const manualKwh = 350;
    const manualBill = 2800;

    const metrics = calculateBillMetrics(manualKwh, manualBill, 0.72, 4);

    assert.equal(metrics.monthlyKwh, 350);
    assert.equal(metrics.monthlyBill, 2800);
    assert.equal(metrics.monthlyCarbonKg, 252);
    assert.equal(metrics.classification.tier, "Moderate"); // 350 for household 4 is within Moderate threshold
  });
});
