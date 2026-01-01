"use client";

import { motion } from "framer-motion";
import { MathRenderer } from "./MathRenderer";
import type { Problem } from "@/lib/types";

interface ProblemCardProps {
  problem: Problem;
  children?: React.ReactNode;
}

export function ProblemCard({ problem, children }: ProblemCardProps) {
  const tierColors: Record<number, string> = {
    1: "bg-green-100 text-green-700",
    2: "bg-blue-100 text-blue-700",
    3: "bg-purple-100 text-purple-700",
    4: "bg-orange-100 text-orange-700",
    5: "bg-red-100 text-red-700",
  };

  const tierLabels: Record<number, string> = {
    1: "Warmup",
    2: "Easy",
    3: "Medium",
    4: "Hard",
    5: "Challenge",
  };

  const tierClass = `px-3 py-1 rounded-full text-sm font-semibold ${tierColors[problem.tier] || "bg-purple-100 text-purple-700"}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="card p-6 md:p-8"
    >
      {/* Tier Badge */}
      <div className="flex justify-between items-center mb-6">
        <span className={tierClass}>
          {tierLabels[problem.tier] || "Medium"}
        </span>
      </div>

      {/* Problem */}
      <div className="mb-8">
        <MathRenderer
          text={problem.problem_text}
          latex={problem.problem_latex}
          className="text-center"
        />
      </div>

      {/* Children (Answer input, feedback, etc.) */}
      {children}
    </motion.div>
  );
}
