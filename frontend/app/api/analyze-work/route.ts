import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

export const maxDuration = 60; // 1 minute for AI analysis

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { problem, canvasImage, previousQuestions } = body;

    if (!problem || !canvasImage) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: problem, canvasImage" },
        { status: 400 }
      );
    }

    if (BACKEND_URL) {
      const response = await fetch(`${BACKEND_URL}/api/analyze-work`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem, canvasImage, previousQuestions }),
      });

      const result = await response.json();
      return NextResponse.json(result, { status: response.status });
    }

    return NextResponse.json(
      { success: false, error: "Backend URL not configured" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error analyzing work:", error);
    return NextResponse.json(
      { success: false, error: "Failed to analyze work" },
      { status: 500 }
    );
  }
}
