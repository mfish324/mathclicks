import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (BACKEND_URL) {
      const response = await fetch(`${BACKEND_URL}/api/generate-from-standard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();
      return NextResponse.json(result, { status: response.status });
    }

    return NextResponse.json(
      { success: false, error: "Backend URL not configured" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error generating from standard:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate problems from standard" },
      { status: 500 }
    );
  }
}
