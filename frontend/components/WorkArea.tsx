"use client";

import { useState, useEffect, useRef } from "react";
import { AnswerInput } from "./AnswerInput";

interface WorkAreaProps {
  onSubmit: (answer: string) => void;
  onSkip?: () => void;
  disabled?: boolean;
  problemId: string;
  requiredWorkImage?: string | null;  // If set, work upload is required
}

export function WorkArea({
  onSubmit,
  onSkip,
  disabled = false,
  problemId,
  requiredWorkImage,
}: WorkAreaProps) {
  const [answer, setAnswer] = useState("");
  const prevProblemId = useRef(problemId);

  // Reset answer when problem changes
  useEffect(() => {
    if (problemId !== prevProblemId.current) {
      setAnswer("");
      prevProblemId.current = problemId;
    }
  }, [problemId]);

  const handleSubmit = (answerText: string) => {
    onSubmit(answerText);
  };

  return (
    <div className="space-y-4">
      {/* Work required indicator */}
      {requiredWorkImage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
          <p className="text-sm text-green-700">
            Work photo uploaded. You can now submit your answer.
          </p>
        </div>
      )}

      <AnswerInput
        onSubmit={handleSubmit}
        onSkip={onSkip}
        disabled={disabled}
      />
    </div>
  );
}
