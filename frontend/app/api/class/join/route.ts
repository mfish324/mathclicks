import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classCode, session } = body;

    if (!classCode || !session) {
      return NextResponse.json(
        { success: false, error: "Missing classCode or session" },
        { status: 400 }
      );
    }

    if (BACKEND_URL) {
      const response = await fetch(`${BACKEND_URL}/api/class/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classCode, session }),
      });

      const result = await response.json();
      return NextResponse.json(result, { status: response.status });
    }

    return NextResponse.json(
      { success: false, error: "Backend URL not configured" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error joining class:", error);
    return NextResponse.json(
      { success: false, error: "Failed to join class" },
      { status: 500 }
    );
  }
}
