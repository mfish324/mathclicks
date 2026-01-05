"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap, Star, Trophy, Flame } from "lucide-react";
import type { XpAward, LevelUpResult, Achievement } from "@/lib/gamification";

interface XpPopupProps {
  awards: XpAward[];
  levelUp: LevelUpResult | null;
  newAchievements: Achievement[];
  onComplete: () => void;
}

export function XpPopup({ awards, levelUp, newAchievements, onComplete }: XpPopupProps) {
  const totalXp = awards.reduce((sum, a) => sum + a.amount, 0);
  const hasContent = awards.length > 0 || levelUp || newAchievements.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onComplete}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 15 }}
          className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Level Up! */}
          {levelUp && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-center mb-6"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg"
              >
                <Star className="w-10 h-10 text-white fill-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-800">Level Up!</h2>
              <p className="text-lg text-indigo-600 font-semibold">
                Level {levelUp.previousLevel} → Level {levelUp.newLevel}
              </p>
            </motion.div>
          )}

          {/* XP Awards */}
          {awards.length > 0 && (
            <div className="space-y-2 mb-4">
              {awards.map((award, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * i }}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    award.isBonus ? "bg-amber-50" : "bg-indigo-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {award.isBonus ? (
                      <Flame className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Zap className="w-4 h-4 text-indigo-500" />
                    )}
                    <span className="text-sm text-gray-700">{award.reason}</span>
                  </div>
                  <span className={`font-bold ${award.isBonus ? "text-amber-600" : "text-indigo-600"}`}>
                    +{award.amount} XP
                  </span>
                </motion.div>
              ))}

              {/* Total */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 * awards.length + 0.2 }}
                className="flex items-center justify-center gap-2 pt-2 border-t border-gray-200"
              >
                <Zap className="w-5 h-5 text-indigo-600" />
                <span className="text-xl font-bold text-indigo-600">+{totalXp} XP Total</span>
              </motion.div>
            </div>
          )}

          {/* New Achievements */}
          {newAchievements.length > 0 && (
            <div className="space-y-2 mb-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                New Achievement{newAchievements.length > 1 ? "s" : ""}!
              </h3>
              {newAchievements.map((achievement, i) => (
                <motion.div
                  key={achievement.id}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + 0.1 * i }}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-2xl">
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-800">{achievement.name}</div>
                    <div className="text-sm text-gray-600">{achievement.description}</div>
                  </div>
                  <Trophy className="w-5 h-5 text-amber-500" />
                </motion.div>
              ))}
            </div>
          )}

          {/* Continue Button */}
          <motion.button
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={onComplete}
            className="w-full btn btn-primary"
          >
            Awesome!
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
