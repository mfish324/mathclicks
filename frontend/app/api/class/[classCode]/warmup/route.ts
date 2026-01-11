import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classCode: string }> }
) {
  const { classCode } = await params;

  try {
    if (BACKEND_URL) {
      const response = await fetch(`${BACKEND_URL}/api/class/${classCode}/warmup`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();
      return NextResponse.json(result, { status: response.status });
    }

    // Fallback: return default disabled warm-up
    return NextResponse.json({
      success: true,
      data: {
        enabled: false,
        duration: 2,
        focus: "mixed",
        required: false,
      },
    });
  } catch (error) {
    console.error("Error fetching warm-up settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch warm-up settings" },
      { status: 500 }
    );
  }
}
