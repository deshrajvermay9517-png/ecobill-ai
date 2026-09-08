import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  validateAndNormalizeRecommendations,
  sanitizeExpectedImpact,
  getGeminiClient,
} from "./gemini";
import {
  calculateBillMetrics,
  calculateReductionScenario,
  DEFAULT_GRID_EMISSION_FACTOR_KG_CO2_PER_KWH,
} from "./carbon";

describe("EcoBill AI - Personalized AI Recommendations Tests", () => {
  // 1. Valid Structured Recommendations Normalization
  test("correctly parses and normalizes complete structured Gemini recommendations", () => {
    const mockOutput = {
      recommendations: [
        {
          id: "rec-1",
          title: "Optimize AC Setpoint to 24°C",
          category: "Cooling & HVAC",
          priority: "high",
          whyItMatches: "Your 280 kWh usage indicates cooling load contributes significantly to power consumption.",
          actionSteps: [
            "Set thermostat to 24°C or higher.",
            "Clean AC filters bi-weekly for optimal airflow.",
          ],
          effort: "low",
          expectedImpact: "Noticeable reduction in peak afternoon compressor runtime.",
          caution: "Ensure room doors and windows are sealed while operating.",
        },
        {
          id: "rec-2",
          title: "Smart Strip for Entertainment Phantom Loads",
          category: "Standby & Phantom Loads",
          priority: "medium",
          whyItMatches: "AV setups and Wi-Fi routers contribute continuous standby draw.",
          actionSteps: [
            "Plug TV and media devices into a switched power strip.",
            "Turn off completely when away or sleeping.",
          ],
          effort: "low",
          expectedImpact: "Moderate drop in baseline overnight energy draw.",
          caution: null,
        },
      ],
    };

    const normalized = validateAndNormalizeRecommendations(mockOutput);

    assert.equal(normalized.length, 2);
    assert.equal(normalized[0].id, "rec-1");
    // AC recommendation is automatically enforced as conditional
    assert.match(normalized[0].title, /^If You Use Air Conditioning:/);
    assert.equal(normalized[0].category, "Cooling & HVAC");
    assert.equal(normalized[0].priority, "high");
    assert.equal(normalized[0].effort, "low");
    assert.equal(normalized[0].actionSteps.length, 2);
    assert.equal(normalized[0].expectedImpact, "Noticeable reduction in peak afternoon compressor runtime.");
    assert.equal(normalized[0].caution, "Ensure room doors and windows are sealed while operating.");

    assert.equal(normalized[1].priority, "medium");
    // Standby recommendation remains non-conditional
    assert.equal(normalized[1].title, "Smart Strip for Entertainment Phantom Loads");
    assert.equal(normalized[1].caution, null);
  });

  // 2. Normalization Fallbacks
  test("applies graceful fallbacks for missing or invalid priority, effort, and action steps", () => {
    const rawWithInvalidEnums = {
      recommendations: [
        {
          id: "rec-fallback",
          title: "Appliance Scheduling",
          category: "Appliance Scheduling",
          priority: "critical_urgent", // invalid priority
          whyItMatches: "Moderate tier household usage.",
          actionSteps: [], // empty steps
          effort: "super_hard", // invalid effort
          expectedImpact: "Good reduction.",
          caution: "",
        },
      ],
    };

    const normalized = validateAndNormalizeRecommendations(rawWithInvalidEnums);

    assert.equal(normalized.length, 1);
    assert.equal(normalized[0].priority, "medium"); // falls back to medium
    assert.equal(normalized[0].effort, "medium"); // falls back to medium
    assert.ok(normalized[0].actionSteps.length >= 1); // provided default action step
    assert.equal(normalized[0].caution, null); // empty string normalized to null
  });

  // 3. Qualitative-Only Expected Impact Enforcement
  test("neutralizes numeric rupee, kWh, or carbon claims from expectedImpact", () => {
    // Numeric claims should be transformed so deterministic engine remains sole authority
    const textWithRupees = "Saves ₹450 per month during summer.";
    const sanitizedRupees = sanitizeExpectedImpact(textWithRupees);
    assert.ok(!sanitizedRupees.includes("₹450"));
    assert.ok(sanitizedRupees.includes("energy costs"));

    const textWithKwh = "Reduces 35 kWh per month from geyser cycling.";
    const sanitizedKwh = sanitizeExpectedImpact(textWithKwh);
    assert.ok(!sanitizedKwh.includes("35 kWh"));
    assert.ok(sanitizedKwh.includes("energy consumption"));

    const textWithCo2 = "Prevents 25 kg CO2 emissions annually.";
    const sanitizedCo2 = sanitizeExpectedImpact(textWithCo2);
    assert.ok(!sanitizedCo2.includes("25 kg CO2"));
    assert.ok(sanitizedCo2.includes("carbon emissions"));

    // Purely qualitative text remains intact
    const qualitative = "Noticeable drop in compressor load during hot afternoons.";
    assert.equal(sanitizeExpectedImpact(qualitative), qualitative);
  });

  // 4. Safe Handling of Malformed AI Responses
  test("handles null, undefined, empty, or non-array inputs without throwing", () => {
    assert.deepEqual(validateAndNormalizeRecommendations(null), []);
    assert.deepEqual(validateAndNormalizeRecommendations(undefined), []);
    assert.deepEqual(validateAndNormalizeRecommendations({}), []);
    assert.deepEqual(validateAndNormalizeRecommendations("string response"), []);
    assert.deepEqual(validateAndNormalizeRecommendations({ recommendations: "not-an-array" }), []);
    assert.deepEqual(validateAndNormalizeRecommendations({ recommendations: [null, 123, "invalid"] }), []);
  });

  // 5. Missing GEMINI_API_KEY handling
  test("getGeminiClient throws descriptive error when GEMINI_API_KEY is empty", () => {
    const originalKey = process.env.GEMINI_API_KEY;
    try {
      delete process.env.GEMINI_API_KEY;
      assert.throws(
        () => getGeminiClient(),
        /GEMINI_API_KEY is not configured/
      );
    } finally {
      if (originalKey) {
        process.env.GEMINI_API_KEY = originalKey;
      }
    }
  });

  // 6. Deterministic Calculation Independence
  test("deterministic carbon calculations remain completely untouched and authoritative", () => {
    const sampleKwh = 280;
    const sampleBill = 2100;
    const factor = DEFAULT_GRID_EMISSION_FACTOR_KG_CO2_PER_KWH; // 0.72

    const metrics = calculateBillMetrics(sampleKwh, sampleBill, factor, 3);
    assert.equal(metrics.monthlyKwh, 280);
    assert.equal(metrics.monthlyBill, 2100);
    assert.equal(metrics.monthlyCarbonKg, Number((280 * 0.72).toFixed(1))); // 201.6
    assert.equal(metrics.effectiveRatePerKwh, 7.5);

    const scenario15 = calculateReductionScenario(sampleKwh, sampleBill, 15, factor);
    assert.equal(scenario15.kwhSavedMonthly, 42);
    assert.equal(scenario15.billSavedMonthly, 315);
    assert.equal(scenario15.carbonSavedKgMonthly, Number((42 * 0.72).toFixed(2))); // 30.24
  });

  // 7. Unconfirmed AC recommendation must be conditional in title and body
  test("unconfirmed AC recommendation must be conditional in title and body", () => {
    const rawAiOutput = {
      recommendations: [
        {
          id: "rec-ac",
          title: "Optimizing Air Conditioning Temperature Settings",
          category: "Cooling",
          priority: "high",
          whyItMatches: "In warm regions, your air conditioner is the largest contributor to electricity consumption.",
          actionSteps: [
            "Set your AC thermostat to 24°C or higher.",
            "Clean AC filters bi-weekly.",
          ],
          effort: "low",
          expectedImpact: "Noticeable reduction during peak evening hours.",
          caution: null,
        },
      ],
    };

    const [rec] = validateAndNormalizeRecommendations(rawAiOutput);

    // Title must be explicitly conditional
    assert.match(rec.title, /^If You Use Air Conditioning:/i);
    assert.equal(rec.title, "If You Use Air Conditioning: Optimize Temperature Settings");

    // Explanation must not imply confirmed ownership ("your air conditioner")
    assert.ok(!rec.whyItMatches.includes("your air conditioner"));
    assert.match(rec.whyItMatches, /if/i);

    // Action steps must soften imperatives and avoid "your AC"
    assert.ok(!rec.actionSteps.some((step) => step.includes("your AC")));
  });

  // 8. Unconfirmed water-heater recommendation must be conditional in title and body
  test("unconfirmed water-heater recommendation must be conditional in title and body", () => {
    const rawAiOutput = {
      recommendations: [
        {
          id: "rec-wh",
          title: "Efficient Water Heating Practices",
          category: "Water Heating",
          priority: "medium",
          whyItMatches: "Water heating contributes significantly to morning peak load.",
          actionSteps: [
            "Switch off your geyser immediately after bath.",
            "Lower the temperature setting to 50°C.",
          ],
          effort: "medium",
          expectedImpact: "Moderate drop in daily morning heating units.",
          caution: null,
        },
      ],
    };

    const [rec] = validateAndNormalizeRecommendations(rawAiOutput);

    // Title must be explicitly conditional
    assert.match(rec.title, /^If You Use an Electric Water Heater:/i);
    assert.equal(rec.title, "If You Use an Electric Water Heater: Efficient Water Heating Practices");

    // Explanation must be conditional
    assert.match(rec.whyItMatches, /if/i);

    // Action steps must not say "your geyser"
    assert.ok(!rec.actionSteps.some((step) => step.includes("your geyser")));
  });

  // 9. Generic standby-power recommendation may remain normal
  test("generic standby-power recommendation may remain normal (non-conditional)", () => {
    const rawAiOutput = {
      recommendations: [
        {
          id: "rec-standby",
          title: "Managing Standby Power for Entertainment and Office Electronics",
          category: "Plug Loads & Standby",
          priority: "medium",
          whyItMatches: "A moderate baseline consumption profile benefits from eliminating continuous phantom draw from idle electronics.",
          actionSteps: [
            "Identify multi-plug power strips connected to televisions and set-top boxes.",
            "Switch off power strips completely when entertainment systems are not in use.",
          ],
          effort: "low",
          expectedImpact: "Moderate baseline drop in continuous standby consumption.",
          caution: null,
        },
      ],
    };

    const [rec] = validateAndNormalizeRecommendations(rawAiOutput);

    // Should remain normal and NOT be prefixed with "If You Use..."
    assert.equal(rec.title, "Managing Standby Power for Entertainment and Office Electronics");
    assert.ok(!rec.title.startsWith("If You Use"));
  });

  // 10. Generic lighting recommendation may remain normal
  test("generic lighting recommendation may remain normal (non-conditional)", () => {
    const rawAiOutput = {
      recommendations: [
        {
          id: "rec-lighting",
          title: "Transition to Task and LED Lighting",
          category: "Lighting",
          priority: "low",
          whyItMatches: "Upgrading general household illumination aligns well with achieving efficiency targets.",
          actionSteps: [
            "Replace older bulbs with LED alternatives in frequently used spaces.",
            "Turn off lights in unoccupied rooms.",
          ],
          effort: "low",
          expectedImpact: "Steady minor reduction in daily lighting energy use.",
          caution: null,
        },
      ],
    };

    const [rec] = validateAndNormalizeRecommendations(rawAiOutput);

    // Should remain normal and NOT be forced conditional
    assert.equal(rec.title, "Transition to Task and LED Lighting");
    assert.ok(!rec.title.startsWith("If You Use"));
  });
});
