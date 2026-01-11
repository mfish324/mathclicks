import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classCode: string }> }
) {
  const { classCode } = await params;

  try {
    if (BACKEND_URL) {
      const response = await fetch(`${BACKEND_URL}/api/class/${classCode}/settings`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();
      return NextResponse.json(result, { status: response.status });
    }

    // Fallback: return default settings
    return NextResponse.json({
      success: true,
      data: {
        classCode,
        gradeLevel: 6,
        warmUp: {
          enabled: false,
          duration: 2,
          focus: "mixed",
          required: false,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching class settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch class settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ classCode: string }> }
) {
  const { classCode } = await params;

  try {
    const body = await request.json();

    if (BACKEND_URL) {
      const response = await fetch(`${BACKEND_URL}/api/class/${classCode}/settings`, {
        method: "PATCH",
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
    console.error("Error updating class settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update class settings" },
      { status: 500 }
    );
  }
}
