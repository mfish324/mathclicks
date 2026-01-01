"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  isLoading?: boolean;
}

export function ImageUploader({ onImageSelect, isLoading }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/gif": [".gif"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    disabled: isLoading,
  });

  const clearPreview = () => {
    setPreview(null);
    setSelectedFile(null);
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onImageSelect(selectedFile);
    }
  };

  const dropzoneClass = isDragActive
    ? "border-2 border-dashed border-[var(--primary)] bg-indigo-50 rounded-2xl p-8 cursor-pointer transition-all duration-200"
    : "border-2 border-dashed border-gray-300 hover:border-[var(--primary)] rounded-2xl p-8 cursor-pointer transition-all duration-200";

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {!preview ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div
              {...getRootProps()}
              className={dropzoneClass}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Upload className="w-10 h-10 text-[var(--primary)]" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-gray-700">
                    {isDragActive ? "Drop your image here!" : "Upload a photo"}
                  </p>
                  <p className="text-gray-500 mt-1">Drag & drop or tap to select</p>
                </div>
                <p className="text-sm text-gray-400">Supports: JPEG, PNG, GIF, WebP</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.capture = "environment";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    setSelectedFile(file);
                    const reader = new FileReader();
                    reader.onload = () => setPreview(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }}
              className="w-full btn btn-primary flex items-center justify-center gap-3"
            >
              <Camera className="w-6 h-6" />
              Take a Photo
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4"
          >
            <div className="card p-4 relative">
              <button
                onClick={clearPreview}
                disabled={isLoading}
                className="absolute top-2 right-2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
              <img src={preview} alt="Preview" className="w-full rounded-lg object-contain max-h-80" />
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full btn btn-primary flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Analyzing your math...
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6" />
                  Generate Practice Problems
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
