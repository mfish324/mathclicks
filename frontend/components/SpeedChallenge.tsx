"use client";

import { useState, useEffect, useCallback } from "react";
import {
  generateSpeedChallengeFacts,
  checkMathFactAnswer,
  type MathFact,
  type GradeLevel,
} from "../lib/math-facts";
import {
  handleSpeedChallengeCompleted,
  getOrCreateProfileWithMigration,
  type SpeedChallengeResult,
} from "../lib/gamification";

interface SpeedChallengeProps {
  gradeLevel: GradeLevel;
  onComplete: (result: SpeedChallengeResult) => void;
  onClose: () => void;
}

const CHALLENGE_DURATION = 60; // 60 seconds

export function SpeedChallenge({
  gradeLevel,
  onComplete,
  onClose,
}: SpeedChallengeProps) {
  const [facts, setFacts] = useState<MathFact[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(CHALLENGE_DURATION);
  const [isStarted, setIsStarted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [attemptedCount, setAttemptedCount] = useState(0);
  const [showFeedback, setShowFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [result, setResult] = useState<SpeedChallengeResult | null>(null);
  const [bestScore, setBestScore] = useState(0);

  // Generate facts and get best score on mount
  useEffect(() => {
    const generatedFacts = generateSpeedChallengeFacts(gradeLevel);
    setFacts(generatedFacts);

    const profile = getOrCreateProfileWithMigration();
    setBestScore(profile.speedChallengeStats.bestScore);
  }, [gradeLevel]);

  // Timer countdown
  useEffect(() => {
    if (!isStarted || isComplete || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, isComplete, timeLeft]);

  // Handle completion
  useEffect(() => {
    if (isComplete && !result) {
      const profile = getOrCreateProfileWithMigration();
      const challengeResult = handleSpeedChallengeCompleted(
        profile,
        attemptedCount,
        correctCount
      );
      setResult(challengeResult);
    }
  }, [isComplete, result, attemptedCount, correctCount]);

  const handleSubmit = useCallback(() => {
    if (!answer.trim() || showFeedback) return;

    const currentFact = facts[currentIndex];
    const isCorrect = checkMathFactAnswer(currentFact, answer);

    setAttemptedCount((prev) => prev + 1);
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    }

    setShowFeedback(isCorrect ? "correct" : "incorrect");

    // Move to next problem quickly
    setTimeout(() => {
      setShowFeedback(null);
      setAnswer("");

      if (currentIndex + 1 >= facts.length) {
        // Ran out of facts (unlikely in 60 seconds)
        setIsComplete(true);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 300); // Faster feedback for speed challenge
  }, [answer, currentIndex, facts, showFeedback]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFinish = () => {
    if (result) {
      onComplete(result);
    }
  };

  const currentFact = facts[currentIndex];

  // Start screen
  if (!isStarted) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">!</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">60-Second Blitz!</h2>
          <p className="text-gray-600 mb-6">
            Answer as many math facts as you can in 60 seconds!
          </p>

          {bestScore > 0 && (
            <div className="bg-purple-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-purple-800">
                Your best: <span className="font-bold text-lg">{bestScore}</span> correct
              </p>
            </div>
          )}

          <div className="bg-yellow-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <span className="font-bold">15 XP</span> for completing +{" "}
              <span className="font-bold">25 XP</span> if perfect +{" "}
              <span className="font-bold">5 XP</span> if 20+ correct!
            </p>
          </div>

          <button
            onClick={() => setIsStarted(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-4 px-6 rounded-xl font-bold text-xl hover:opacity-90 transition-opacity mb-3"
          >
            Start Challenge!
          </button>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Maybe later
          </button>
        </div>
      </div>
    );
  }

  // Completion screen
  if (isComplete && result) {
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const totalXp = result.xpAwarded.reduce((sum, xp) => sum + xp.amount, 0);

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          {result.isNewBest ? (
            <>
              <div className="text-6xl mb-4">!</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">New Personal Best!</h2>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">!</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Challenge Complete!</h2>
            </>
          )}

          <div className="grid grid-cols-3 gap-3 my-6">
            <div className="bg-blue-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-blue-600">{correctCount}</div>
              <div className="text-xs text-blue-800">Correct</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-purple-600">{accuracy}%</div>
              <div className="text-xs text-purple-800">Accuracy</div>
            </div>
            <div className="bg-green-50 rounded-xl p-3">
              <div className="text-2xl font-bold text-green-600">+{totalXp}</div>
              <div className="text-xs text-green-800">XP</div>
            </div>
          </div>

          {/* XP Breakdown */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <div className="text-sm font-medium text-gray-700 mb-2">XP Earned:</div>
            {result.xpAwarded.map((xp, i) => (
              <div key={i} className="flex justify-between text-sm text-gray-600">
                <span>{xp.reason}</span>
                <span className={xp.isBonus ? "text-green-600 font-medium" : ""}>
                  +{xp.amount}
                </span>
              </div>
            ))}
          </div>

          {/* New achievements */}
          {result.newAchievements.length > 0 && (
            <div className="mb-6">
              <div className="text-sm font-medium text-gray-700 mb-2">
                New Achievements!
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {result.newAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="bg-yellow-100 rounded-full px-3 py-1 flex items-center gap-1"
                  >
                    <span>{achievement.icon}</span>
                    <span className="text-sm font-medium text-yellow-800">
                      {achievement.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Level up */}
          {result.levelUp && (
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 mb-6">
              <div className="text-2xl font-bold text-purple-600">
                Level Up! Level {result.levelUp.newLevel}
              </div>
            </div>
          )}

          <button
            onClick={handleFinish}
            className="w-full bg-green-500 text-white py-4 px-6 rounded-xl font-bold text-xl hover:bg-green-600 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // Active challenge screen
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
        {/* Timer and score */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-xl font-bold text-green-600">
            {correctCount} correct
          </div>
          <div
            className={`text-4xl font-bold ${
              timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-gray-900"
            }`}
          >
            {timeLeft}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-gray-200 rounded-full mb-8 overflow-hidden">
          <div
            className="h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
            style={{ width: `${((CHALLENGE_DURATION - timeLeft) / CHALLENGE_DURATION) * 100}%` }}
          />
        </div>

        {/* Problem */}
        {currentFact && (
          <div className="text-center mb-8">
            <div
              className={`text-5xl font-bold mb-6 transition-colors ${
                showFeedback === "correct"
                  ? "text-green-500"
                  : showFeedback === "incorrect"
                  ? "text-red-500"
                  : "text-gray-900"
              }`}
            >
              {currentFact.problem_text.replace(" = ?", "")}
            </div>

            <div className="flex items-center justify-center gap-4">
              <span className="text-5xl font-bold text-gray-900">=</span>
              <input
                type="text"
                inputMode="decimal"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className={`w-36 text-5xl font-bold text-center border-b-4 outline-none transition-colors ${
                  showFeedback === "correct"
                    ? "border-green-500 text-green-500"
                    : showFeedback === "incorrect"
                    ? "border-red-500 text-red-500"
                    : "border-purple-500 text-gray-900"
                }`}
                disabled={showFeedback !== null}
              />
            </div>
          </div>
        )}

        {/* Submit button (optional, Enter key is faster) */}
        <button
          onClick={handleSubmit}
          disabled={!answer.trim() || showFeedback !== null}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-4 px-6 rounded-xl font-bold text-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          Submit (or press Enter)
        </button>
      </div>
    </div>
  );
}
