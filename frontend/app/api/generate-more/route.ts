import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

// Extend timeout for AI operations
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { extraction, tier, count = 3 } = body;

    if (!extraction) {
      return NextResponse.json(
        { success: false, error: "Missing extraction data" },
        { status: 400 }
      );
    }

    if (BACKEND_URL) {
      const response = await fetch(`${BACKEND_URL}/api/generate-problems`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraction, options: { tier, count } }),
      });

      const result = await response.json();
      return NextResponse.json(result, { status: response.status });
    }

    // Fallback - not implemented for CLI bridge
    return NextResponse.json(
      { success: false, error: "Backend URL not configured" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error generating problems:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate problems" },
      { status: 500 }
    );
  }
}
