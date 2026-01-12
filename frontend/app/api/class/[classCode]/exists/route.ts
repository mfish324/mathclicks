import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classCode: string }> }
) {
  const { classCode } = await params;

  try {
    if (BACKEND_URL) {
      const response = await fetch(`${BACKEND_URL}/api/class/${classCode}/exists`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();
      return NextResponse.json(result, { status: response.status });
    }

    // Fallback when no backend: assume class doesn't exist
    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error("Error checking class:", error);
    return NextResponse.json(
      { exists: false, error: "Failed to check class" },
      { status: 500 }
    );
  }
}
