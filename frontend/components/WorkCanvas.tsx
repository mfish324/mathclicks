"use client";

import { useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";
import { Pencil, Eraser, Undo2, Trash2, Check } from "lucide-react";

export interface WorkCanvasRef {
  exportImage: () => Promise<string | null>;
  clearCanvas: () => void;
  hasContent: () => boolean;
}

interface WorkCanvasProps {
  onCheckWork?: () => void;
  disabled?: boolean;
  showCheckButton?: boolean;
}

type Tool = "draw" | "erase";

export const WorkCanvas = forwardRef<WorkCanvasRef, WorkCanvasProps>(
  function WorkCanvas({ onCheckWork, disabled = false, showCheckButton = true }, ref) {
    const canvasRef = useRef<ReactSketchCanvasRef>(null);
    const [activeTool, setActiveTool] = useState<Tool>("draw");
    const [hasDrawn, setHasDrawn] = useState(false);

    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      exportImage: async () => {
        if (!canvasRef.current) return null;
        try {
          const dataUrl = await canvasRef.current.exportImage("png");
          return dataUrl;
        } catch (error) {
          console.error("Failed to export canvas:", error);
          return null;
        }
      },
      clearCanvas: () => {
        canvasRef.current?.clearCanvas();
        setHasDrawn(false);
      },
      hasContent: () => hasDrawn,
    }));

    const handleToolChange = useCallback((tool: Tool) => {
      setActiveTool(tool);
      if (tool === "erase") {
        canvasRef.current?.eraseMode(true);
      } else {
        canvasRef.current?.eraseMode(false);
      }
    }, []);

    const handleUndo = useCallback(() => {
      canvasRef.current?.undo();
    }, []);

    const handleClear = useCallback(() => {
      canvasRef.current?.clearCanvas();
      setHasDrawn(false);
    }, []);

    const handleStroke = useCallback(() => {
      setHasDrawn(true);
    }, []);

    return (
      <div className="flex flex-col gap-3">
        {/* Canvas Area */}
        <div
          className={`relative rounded-xl overflow-hidden border-2 transition-colors ${
            disabled
              ? "border-gray-200 opacity-60"
              : "border-indigo-200 hover:border-indigo-300"
          }`}
          style={{ touchAction: "none" }}
        >
          {/* Encouraging placeholder text */}
          {!hasDrawn && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <p className="text-gray-400 text-lg">Show your work here...</p>
            </div>
          )}

          <ReactSketchCanvas
            ref={canvasRef}
            width="100%"
            height="280px"
            strokeWidth={3}
            strokeColor="#1e293b"
            eraserWidth={20}
            canvasColor="#fefefe"
            style={{
              borderRadius: "0.75rem",
              cursor: activeTool === "erase" ? "crosshair" : "crosshair",
            }}
            onStroke={handleStroke}
            allowOnlyPointerType="all"
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Draw Tool */}
            <button
              type="button"
              onClick={() => handleToolChange("draw")}
              disabled={disabled}
              className={`p-3 rounded-lg transition-all ${
                activeTool === "draw"
                  ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Draw"
            >
              <Pencil className="w-5 h-5" />
            </button>

            {/* Eraser Tool */}
            <button
              type="button"
              onClick={() => handleToolChange("erase")}
              disabled={disabled}
              className={`p-3 rounded-lg transition-all ${
                activeTool === "erase"
                  ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Eraser"
            >
              <Eraser className="w-5 h-5" />
            </button>

            <div className="w-px h-8 bg-gray-200 mx-1" />

            {/* Undo */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={disabled}
              className="p-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Undo"
            >
              <Undo2 className="w-5 h-5" />
            </button>

            {/* Clear */}
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="p-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Clear All"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {/* Check My Work Button */}
          {showCheckButton && hasDrawn && onCheckWork && (
            <button
              type="button"
              onClick={onCheckWork}
              disabled={disabled}
              className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              Check My Work
            </button>
          )}
        </div>
      </div>
    );
  }
);
