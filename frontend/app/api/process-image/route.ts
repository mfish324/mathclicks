import { NextRequest, NextResponse } from "next/server";

// Backend URL - when set, proxies to backend server; otherwise uses CLI bridge
const BACKEND_URL = process.env.BACKEND_URL;

// Extend timeout for long-running AI operations (image extraction + problem generation)
export const maxDuration = 300; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image." },
        { status: 400 }
      );
    }

    // If backend URL is configured, proxy to backend server
    if (BACKEND_URL) {
      const backendFormData = new FormData();
      backendFormData.append("image", file);
      // Generate initial problems at difficulty matching the extracted content
      // Backend will use difficulty_baseline from extraction to determine tier
      backendFormData.append("count", "3");

      const response = await fetch(`${BACKEND_URL}/api/process-image`, {
        method: "POST",
        body: backendFormData,
      });

      const result = await response.json();
      return NextResponse.json(result, { status: response.status });
    }

    // Fallback to CLI bridge (for local development without backend server)
    const { processImage, saveUploadedFile, cleanupFile } = await import("@/lib/mathclicks-server");

    let tempFilePath: string | null = null;
    try {
      tempFilePath = await saveUploadedFile(file);
      const result = await processImage(tempFilePath, { count: 3 });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || "Failed to process image" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          extraction: result.extraction,
          problems: result.problems,
        },
      });
    } finally {
      if (tempFilePath) {
        cleanupFile(tempFilePath);
      }
    }
  } catch (error) {
    console.error("Error processing image:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
