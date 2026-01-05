"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenLine, Keyboard } from "lucide-react";
import { WorkCanvas, WorkCanvasRef } from "./WorkCanvas";
import { AnswerInput } from "./AnswerInput";

interface WorkAreaProps {
  onSubmit: (answer: string, canvasImage?: string) => void;
  onSkip?: () => void;
  onCheckWork?: (canvasImage: string) => void;
  disabled?: boolean;
  showCheckWork?: boolean;
  problemId: string;  // Used to reset canvas when problem changes
}

type Mode = "canvas" | "answer";

export function WorkArea({
  onSubmit,
  onSkip,
  onCheckWork,
  disabled = false,
  showCheckWork = false,
  problemId,
}: WorkAreaProps) {
  const [mode, setMode] = useState<Mode>("canvas");
  const [answer, setAnswer] = useState("");
  const canvasRef = useRef<WorkCanvasRef>(null);
  const prevProblemId = useRef(problemId);

  // Reset canvas when problem changes
  useEffect(() => {
    if (problemId !== prevProblemId.current) {
      canvasRef.current?.clearCanvas();
      setAnswer("");
      prevProblemId.current = problemId;
    }
  }, [problemId]);

  const handleSubmit = async (answerText: string) => {
    // Get canvas image if student used it
    let canvasImage: string | undefined;
    if (mode === "canvas" && canvasRef.current?.hasContent()) {
      canvasImage = await canvasRef.current.exportImage() || undefined;
    }
    onSubmit(answerText, canvasImage);
  };

  const handleCheckWork = async () => {
    if (canvasRef.current?.hasContent() && onCheckWork) {
      const image = await canvasRef.current.exportImage();
      if (image) {
        onCheckWork(image);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setMode("canvas")}
            disabled={disabled}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              mode === "canvas"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            } disabled:opacity-50`}
          >
            <PenLine className="w-4 h-4" />
            Show Work
          </button>
          <button
            type="button"
            onClick={() => setMode("answer")}
            disabled={disabled}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              mode === "answer"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-gray-600 hover:text-gray-800"
            } disabled:opacity-50`}
          >
            <Keyboard className="w-4 h-4" />
            Answer Only
          </button>
        </div>
      </div>

      {/* Canvas / Answer Area */}
      <AnimatePresence mode="wait">
        {mode === "canvas" ? (
          <motion.div
            key="canvas"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <WorkCanvas
              ref={canvasRef}
              onCheckWork={showCheckWork ? handleCheckWork : undefined}
              disabled={disabled}
              showCheckButton={showCheckWork}
            />

            {/* Answer input below canvas */}
            <div className="mt-4">
              <AnswerInput
                onSubmit={handleSubmit}
                onSkip={onSkip}
                disabled={disabled}
                placeholder="Enter your final answer..."
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="answer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Encouraging message to use canvas */}
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-center">
              <p className="text-sm text-indigo-700">
                Tip: Showing your work helps you learn and lets AI give better feedback!
              </p>
            </div>

            <AnswerInput
              onSubmit={handleSubmit}
              onSkip={onSkip}
              disabled={disabled}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
