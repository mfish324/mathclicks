import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(request: NextRequest) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json(
        { success: false, error: "Backend URL not configured" },
        { status: 501 }
      );
    }

    const grade = request.nextUrl.searchParams.get("grade");
    const query = grade ? `?grade=${encodeURIComponent(grade)}` : "";
    const response = await fetch(`${BACKEND_URL}/api/standards${query}`);

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error fetching standards:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch standards" },
      { status: 500 }
    );
  }
}
