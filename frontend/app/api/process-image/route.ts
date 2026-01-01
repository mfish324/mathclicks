import { NextRequest, NextResponse } from "next/server";
import { processImage, saveUploadedFile, cleanupFile } from "@/lib/mathclicks-server";

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;
  
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
    
    // Save file temporarily
    tempFilePath = await saveUploadedFile(file);
    
    // Process through the pipeline
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
    
  } catch (error) {
    console.error("Error processing image:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  } finally {
    // Clean up temp file
    if (tempFilePath) {
      cleanupFile(tempFilePath);
    }
  }
}
