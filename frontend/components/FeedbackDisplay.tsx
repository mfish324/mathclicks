"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Lightbulb } from "lucide-react";

interface FeedbackDisplayProps {
  correct: boolean | null;
  feedback: string;
  hint?: string;
  onNext?: () => void;
  onTryAgain?: () => void;
}

export function FeedbackDisplay({ correct, feedback, hint, onNext, onTryAgain }: FeedbackDisplayProps) {
  if (correct === null) return null;

  const containerClass = correct
    ? "p-6 rounded-xl bg-[var(--success-light)]"
    : "p-6 rounded-xl bg-[var(--error-light)]";

  const iconContainerClass = correct
    ? "w-12 h-12 rounded-full flex items-center justify-center bg-[var(--success)]"
    : "w-12 h-12 rounded-full flex items-center justify-center bg-[var(--error)]";

  const headingClass = correct
    ? "text-xl font-bold text-[var(--success)]"
    : "text-xl font-bold text-[var(--error)]";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={correct ? "animate-celebrate" : "animate-shake"}
      >
        <div className={containerClass}>
          <div className="flex items-start gap-4">
            <div className={iconContainerClass}>
              {correct ? (
                <CheckCircle className="w-7 h-7 text-white" />
              ) : (
                <XCircle className="w-7 h-7 text-white" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={headingClass}>
                {correct ? "Correct!" : "Not quite..."}
              </h3>
              <p className="text-gray-700 mt-1">{feedback}</p>

              {hint && !correct && (
                <div className="mt-4 p-4 bg-[var(--hint-light)] rounded-lg flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-[var(--hint)] flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700">{hint}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            {correct ? (
              <button onClick={onNext} className="flex-1 btn btn-primary">
                Next Problem
              </button>
            ) : (
              <button onClick={onTryAgain} className="flex-1 btn btn-primary">
                Try Again
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
