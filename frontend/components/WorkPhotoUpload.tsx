"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Upload, X, Loader2, RotateCcw } from "lucide-react";

interface WorkPhotoUploadProps {
  onPhotoUploaded: (base64Image: string) => void;
  onCancel: () => void;
  isAnalyzing: boolean;
  problemText?: string;
}

export function WorkPhotoUpload({
  onPhotoUploaded,
  onCancel,
  isAnalyzing,
  problemText,
}: WorkPhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Image is too large. Please select an image under 10MB.");
      return;
    }

    setError(null);

    // Convert to base64 and show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPreview(base64);
    };
    reader.onerror = () => {
      setError("Failed to read image file");
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = useCallback(() => {
    if (preview) {
      // Extract base64 data (remove data:image/...;base64, prefix)
      const base64Data = preview.split(",")[1] || preview;
      onPhotoUploaded(base64Data);
    }
  }, [preview, onPhotoUploaded]);

  const handleRetake = useCallback(() => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="bg-gradient-to-b from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200">
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-amber-800">Upload Your Work</h3>
        <p className="text-sm text-amber-600 mt-1">
          Take a photo of your notebook work so we can help you understand where you went wrong
        </p>
      </div>

      {/* Problem reference */}
      {problemText && (
        <div className="bg-white/50 rounded-lg p-3 mb-4 text-sm text-gray-600">
          <span className="font-medium">Problem:</span> {problemText}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Preview or Upload Area */}
      {preview ? (
        <div className="space-y-4">
          {/* Image preview */}
          <div className="relative rounded-xl overflow-hidden border-2 border-amber-300 bg-white">
            <img
              src={preview}
              alt="Work preview"
              className="w-full max-h-64 object-contain"
            />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-white rounded-lg px-4 py-2 flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                  <span className="text-sm font-medium">Analyzing your work...</span>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleRetake}
              disabled={isAnalyzing}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 disabled:opacity-50 text-gray-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Retake
            </button>
            <button
              onClick={handleSubmit}
              disabled={isAnalyzing}
              className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Get Feedback
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Camera/Upload button */}
          <button
            onClick={triggerFileInput}
            className="w-full px-6 py-8 bg-white hover:bg-amber-50 border-2 border-dashed border-amber-300 hover:border-amber-400 rounded-xl transition-colors flex flex-col items-center gap-3"
          >
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <Camera className="w-8 h-8 text-amber-600" />
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-800">Take Photo or Upload</p>
              <p className="text-sm text-gray-500 mt-1">
                Tap to open camera or select from gallery
              </p>
            </div>
          </button>

          {/* Cancel button */}
          <button
            onClick={onCancel}
            className="w-full px-4 py-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Skip for now
          </button>
        </div>
      )}
    </div>
  );
}
