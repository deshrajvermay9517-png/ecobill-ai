import { NextRequest, NextResponse } from "next/server";
import { extractBillDataWithGemini, getGeminiModel } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Sanitizes uploaded filenames to prevent directory traversal or header injection.
 */
function sanitizeFilename(rawName: string): string {
  return rawName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .slice(0, 80);
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Server-Side API Key Configuration
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Gemini bill extraction is not configured on the server (missing GEMINI_API_KEY). You can proceed seamlessly using Manual Entry.",
          fallbackToManual: true,
          source: "AI-extracted bill data",
        },
        { status: 503 }
      );
    }

    // 2. Validate Multipart Form Data
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid multipart form data in request.",
          source: "AI-extracted bill data",
        },
        { status: 400 }
      );
    }

    const fileEntry = formData.get("file");
    if (!fileEntry || typeof fileEntry === "string") {
      return NextResponse.json(
        {
          success: false,
          error: "No bill file uploaded. Please select a PDF, JPG, or PNG bill.",
          source: "AI-extracted bill data",
        },
        { status: 400 }
      );
    }

    const file = fileEntry as File;
    const sanitizedName = sanitizeFilename(file.name || "bill-document");

    // 3. Validate File Size
    if (file.size === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Uploaded file is empty (0 bytes).",
          source: "AI-extracted bill data",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds the 10 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please upload a smaller file.`,
          source: "AI-extracted bill data",
        },
        { status: 400 }
      );
    }

    // 4. Validate MIME Type
    const mimeType = file.type?.toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported file type (${mimeType || "unknown"}). Only PDF, JPEG, and PNG electricity bills are accepted.`,
          source: "AI-extracted bill data",
        },
        { status: 400 }
      );
    }

    // 5. Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // 6. Invoke Gemini Extraction
    const modelUsed = getGeminiModel();
    const extractedData = await extractBillDataWithGemini(fileBuffer, mimeType, {
      timeoutMs: 30000,
    });

    return NextResponse.json({
      success: true,
      source: "AI-extracted bill data",
      modelUsed,
      fileName: sanitizedName,
      data: extractedData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Handle rate limits or specific API errors cleanly
    let userFriendlyError = "Failed to extract bill data. Please try again or enter details manually.";
    let statusCode = 500;

    if (message.includes("timed out")) {
      userFriendlyError = "Bill extraction timed out after 30 seconds. Please try again or enter details manually.";
      statusCode = 504;
    } else if (message.includes("429") || message.toLowerCase().includes("quota") || message.toLowerCase().includes("rate limit")) {
      userFriendlyError = "Gemini API rate limit or quota exceeded. Please wait a moment or use manual entry.";
      statusCode = 429;
    } else if (message.includes("API key")) {
      userFriendlyError = "Gemini API authentication failed. Please verify the server GEMINI_API_KEY configuration.";
      statusCode = 503;
    }

    return NextResponse.json(
      {
        success: false,
        error: userFriendlyError,
        fallbackToManual: true,
        source: "AI-extracted bill data",
      },
      { status: statusCode }
    );
  }
}
