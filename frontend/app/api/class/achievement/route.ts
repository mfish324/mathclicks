import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classCode, studentName, achievementName, achievementIcon } = body;

    if (!classCode || !studentName || !achievementName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (BACKEND_URL) {
      const response = await fetch(`${BACKEND_URL}/api/class/achievement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classCode, studentName, achievementName, achievementIcon }),
      });

      const result = await response.json();
      return NextResponse.json(result, { status: response.status });
    }

    return NextResponse.json(
      { success: false, error: "Backend URL not configured" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error reporting achievement:", error);
    return NextResponse.json(
      { success: false, error: "Failed to report achievement" },
      { status: 500 }
    );
  }
}
