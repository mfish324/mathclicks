"use client";

import { motion } from "framer-motion";
import { Star, Zap, Flame } from "lucide-react";
import { getXpForCurrentLevel, getXpNeededForNextLevel } from "@/lib/gamification";

interface XpDisplayProps {
  totalXp: number;
  level: number;
  currentStreak?: number;
  compact?: boolean;
}

export function XpDisplay({ totalXp, level, currentStreak = 0, compact = false }: XpDisplayProps) {
  const currentLevelXp = getXpForCurrentLevel(totalXp);
  const xpNeeded = getXpNeededForNextLevel();
  const progress = (currentLevelXp / xpNeeded) * 100;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {/* Level Badge */}
        <div className="flex items-center gap-1 px-2 py-1 bg-indigo-100 rounded-full">
          <Star className="w-4 h-4 text-indigo-600 fill-indigo-600" />
          <span className="text-sm font-bold text-indigo-700">Lv.{level}</span>
        </div>

        {/* XP */}
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>{totalXp} XP</span>
        </div>

        {/* Streak */}
        {currentStreak > 0 && (
          <div className="flex items-center gap-1 text-sm text-orange-600">
            <Flame className="w-4 h-4" />
            <span>{currentStreak}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
      <div className="flex items-center justify-between mb-3">
        {/* Level Badge */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
            <Star className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <div className="text-lg font-bold text-indigo-700">Level {level}</div>
            <div className="text-xs text-gray-500">{totalXp} total XP</div>
          </div>
        </div>

        {/* Streak */}
        {currentStreak > 0 && (
          <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 rounded-full">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="font-bold text-orange-600">{currentStreak} day streak!</span>
          </div>
        )}
      </div>

      {/* XP Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-500">
          <span>{currentLevelXp} / {xpNeeded} XP to next level</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
