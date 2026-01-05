import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

export async function POST(request: NextRequest) {
  try {
    if (BACKEND_URL) {
      const response = await fetch(`${BACKEND_URL}/api/class/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();
      return NextResponse.json(result, { status: response.status });
    }

    return NextResponse.json(
      { success: false, error: "Backend URL not configured" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error creating class:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create class" },
      { status: 500 }
    );
  }
}
