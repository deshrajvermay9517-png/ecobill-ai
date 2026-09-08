import { NextRequest, NextResponse } from "next/server";
import {
  generatePersonalizedRecommendations,
  getGeminiModel,
  RecommendationContext,
  RecommendationsResponse,
} from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse<RecommendationsResponse>> {
  try {
    // 1. Verify Server-Side API Key Configuration
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Gemini recommendations service is not configured on the server (missing GEMINI_API_KEY).",
          source: "AI-generated recommendations",
        },
        { status: 503 }
      );
    }

    // 2. Parse & Validate JSON Request Body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body.",
          source: "AI-generated recommendations",
        },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "Request body must be a JSON object containing household consumption context.",
          source: "AI-generated recommendations",
        },
        { status: 400 }
      );
    }

    const payload = body as Record<string, unknown>;

    // Validate and sanitize numeric parameters
    const rawKwh = Number(payload.monthlyElectricityUsageKwh);
    if (isNaN(rawKwh) || rawKwh <= 0 || rawKwh > 50000) {
      return NextResponse.json(
        {
          success: false,
          error: "monthlyElectricityUsageKwh must be a valid positive number up to 50,000 kWh.",
          source: "AI-generated recommendations",
        },
        { status: 400 }
      );
    }

    const rawHousehold = Number(payload.householdSize);
    const householdSize = !isNaN(rawHousehold) && rawHousehold >= 1 && rawHousehold <= 20
      ? Math.round(rawHousehold)
      : 3;

    const rawTariff = Number(payload.effectiveTariff);
    const effectiveTariff = !isNaN(rawTariff) && rawTariff >= 0 && rawTariff <= 100
      ? Number(rawTariff.toFixed(2))
      : 7.5;

    const rawTarget = Number(payload.selectedReductionTarget);
    const selectedReductionTarget = !isNaN(rawTarget) && rawTarget >= 1 && rawTarget <= 100
      ? Math.round(rawTarget)
      : 15;

    // Sanitize string parameters
    const stateOrRegion = typeof payload.stateOrRegion === "string"
      ? payload.stateOrRegion.trim().slice(0, 100)
      : "National";

    const usageTier = typeof payload.usageTier === "string"
      ? payload.usageTier.trim().slice(0, 50)
      : "Moderate";

    const context: RecommendationContext = {
      monthlyElectricityUsageKwh: rawKwh,
      householdSize,
      stateOrRegion,
      usageTier,
      effectiveTariff,
      selectedReductionTarget,
    };

    // 3. Generate Gemini Recommendations
    const recommendations = await generatePersonalizedRecommendations(context);

    return NextResponse.json({
      success: true,
      recommendations,
      source: "AI-generated recommendations",
      modelUsed: getGeminiModel(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during recommendation generation.";
    return NextResponse.json(
      {
        success: false,
        error: message,
        source: "AI-generated recommendations",
      },
      { status: 500 }
    );
  }
}
