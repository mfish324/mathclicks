"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { ACHIEVEMENTS, type Achievement } from "@/lib/gamification";

interface AchievementsListProps {
  unlockedAchievements: Achievement[];
  showLocked?: boolean;
}

export function AchievementsList({ unlockedAchievements, showLocked = true }: AchievementsListProps) {
  const unlockedIds = new Set(unlockedAchievements.map((a) => a.id));

  const allAchievements = ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: unlockedIds.has(a.id),
    unlockedAt: unlockedAchievements.find((ua) => ua.id === a.id)?.unlockedAt,
  }));

  const displayAchievements = showLocked
    ? allAchievements
    : allAchievements.filter((a) => a.unlocked);

  if (displayAchievements.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No achievements yet. Keep practicing!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {displayAchievements.map((achievement, i) => (
        <motion.div
          key={achievement.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className={`p-3 rounded-xl text-center transition-all ${
            achievement.unlocked
              ? "bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200"
              : "bg-gray-50 border-2 border-gray-100 opacity-60"
          }`}
        >
          <div
            className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center text-2xl ${
              achievement.unlocked ? "bg-amber-100" : "bg-gray-200"
            }`}
          >
            {achievement.unlocked ? (
              achievement.icon
            ) : (
              <Lock className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div
            className={`font-semibold text-sm ${
              achievement.unlocked ? "text-gray-800" : "text-gray-400"
            }`}
          >
            {achievement.name}
          </div>
          <div
            className={`text-xs mt-1 ${
              achievement.unlocked ? "text-gray-600" : "text-gray-400"
            }`}
          >
            {achievement.description}
          </div>
          {achievement.unlocked && achievement.xpBonus > 0 && (
            <div className="text-xs text-amber-600 font-medium mt-1">
              +{achievement.xpBonus} XP
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
