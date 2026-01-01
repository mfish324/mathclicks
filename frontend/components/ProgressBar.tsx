"use client";

import * as Progress from "@radix-ui/react-progress";

interface ProgressBarProps {
  current: number;
  total: number;
  correct: number;
}

export function ProgressBar({ current, total, correct }: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-gray-600">
          Problem {current} of {total}
        </span>
        <span className="text-[var(--success)] font-semibold">
          {correct} correct
        </span>
      </div>
      <Progress.Root
        className="relative overflow-hidden bg-gray-200 rounded-full w-full h-3"
        value={percentage}
      >
        <Progress.Indicator
          className="bg-[var(--primary)] h-full transition-all duration-500 ease-out rounded-full"
          style={{ width: percentage + "%" }}
        />
      </Progress.Root>
    </div>
  );
}
