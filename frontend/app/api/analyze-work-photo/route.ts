import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

export const maxDuration = 60; // 1 minute timeout

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { problem, workImage, studentAnswer, attemptNumber } = body;

    if (!problem || !workImage || !studentAnswer) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (BACKEND_URL) {
      // Proxy to backend
      const response = await fetch(`${BACKEND_URL}/api/analyze-incorrect-work`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem,
          workImage,
          studentAnswer,
          attemptNumber: attemptNumber || 1,
        }),
      });

      const result = await response.json();
      return NextResponse.json(result, { status: response.status });
    }

    // Fallback for local development without backend
    return NextResponse.json({
      success: true,
      feedback: "Your work shows good effort! Let me help you find where things went a bit off track.",
      errorIdentified: "I noticed a calculation step that needs review.",
      suggestion: "Try double-checking your arithmetic in each step.",
      encouragement: "You're on the right track - keep going!",
    });
  } catch (error) {
    console.error("Error analyzing work photo:", error);
    return NextResponse.json(
      { success: false, error: "Failed to analyze work" },
      { status: 500 }
    );
  }
}
