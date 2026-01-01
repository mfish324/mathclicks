import { NextRequest, NextResponse } from "next/server";
import { checkAnswerWithHints } from "@/lib/mathclicks-server";
import type { CheckAnswerRequest, CheckAnswerResponse, Problem } from "@/lib/types";

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
    
    // Validate the answer
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
