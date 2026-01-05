import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

export const maxDuration = 60; // 1 minute for AI evaluation

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { problem, canvasImage, aiQuestion, studentResponse } = body;

    if (!problem || !canvasImage || !aiQuestion || !studentResponse) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (BACKEND_URL) {
      const response = await fetch(`${BACKEND_URL}/api/evaluate-response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem, canvasImage, aiQuestion, studentResponse }),
      });

      const result = await response.json();
      return NextResponse.json(result, { status: response.status });
    }

    return NextResponse.json(
      { success: false, error: "Backend URL not configured" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error evaluating response:", error);
    return NextResponse.json(
      { success: false, error: "Failed to evaluate response" },
      { status: 500 }
    );
  }
}
