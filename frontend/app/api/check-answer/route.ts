import { NextRequest, NextResponse } from "next/server";
import type { CheckAnswerRequest, CheckAnswerResponse } from "@/lib/types";

// Backend URL - when set, proxies to backend server; otherwise uses CLI bridge
const BACKEND_URL = process.env.BACKEND_URL;

export async function POST(request: NextRequest) {
  try {
    const body: CheckAnswerRequest = await request.json();
    const { problem, studentAnswer, attemptNumber } = body;

    if (!problem || studentAnswer === undefined || attemptNumber === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: problem, studentAnswer, attemptNumber" },
        { status: 400 }
      );
    }

    // If backend URL is configured, proxy to backend server
    if (BACKEND_URL) {
      const response = await fetch(`${BACKEND_URL}/api/check-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem, studentAnswer, attemptNumber }),
      });

      const result = await response.json();
      return NextResponse.json(result, { status: response.status });
    }

    // Fallback to CLI bridge (for local development without backend server)
    const { checkAnswerWithHints } = await import("@/lib/mathclicks-server");

    const result = await checkAnswerWithHints(problem, studentAnswer, attemptNumber);

    // Get the hint text if applicable
    let hintText: string | undefined;
    if (result.hint_to_show !== undefined && problem.hints[result.hint_to_show]) {
      hintText = problem.hints[result.hint_to_show];
    }

    const response: CheckAnswerResponse = {
      correct: result.correct,
      feedback: result.feedback,
      error_type: result.error_type,
      hint_to_show: result.hint_to_show,
      hint_text: hintText,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error checking answer:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
