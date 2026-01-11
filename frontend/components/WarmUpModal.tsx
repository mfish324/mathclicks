"use client";

import { useState, useEffect, useCallback } from "react";
import {
  generateWarmUpFacts,
  checkMathFactAnswer,
  type MathFact,
  type GradeLevel,
  type Operation,
} from "../lib/math-facts";

interface WarmUpModalProps {
  isOpen: boolean;
  gradeLevel: GradeLevel;
  duration: 1 | 2 | 3 | 5; // minutes
  focus: Operation | "mixed";
  required: boolean;
  onComplete: (factsAttempted: number, factsCorrect: number) => void;
  onSkip?: () => void;
}

export function WarmUpModal({
  isOpen,
  gradeLevel,
  duration,
  focus,
  required,
  onComplete,
  onSkip,
}: WarmUpModalProps) {
  const [facts, setFacts] = useState<MathFact[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [isStarted, setIsStarted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [attemptedCount, setAttemptedCount] = useState(0);
  const [showFeedback, setShowFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Generate facts when modal opens
  useEffect(() => {
    if (isOpen && facts.length === 0) {
      const generatedFacts = generateWarmUpFacts(gradeLevel, duration, focus);
      setFacts(generatedFacts);
    }
  }, [isOpen, gradeLevel, duration, focus, facts.length]);

  // Reset state when modal reopens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setAnswer("");
      setTimeLeft(duration * 60);
      setIsStarted(false);
      setCorrectCount(0);
      setAttemptedCount(0);
      setShowFeedback(null);
      setIsComplete(false);
      setFacts([]); // Force regeneration
    }
  }, [isOpen, duration]);

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

  const handleSubmit = useCallback(() => {
    if (!answer.trim() || showFeedback) return;

    const currentFact = facts[currentIndex];
    const isCorrect = checkMathFactAnswer(currentFact, answer);

    setAttemptedCount((prev) => prev + 1);
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    }

    setShowFeedback(isCorrect ? "correct" : "incorrect");

    // Move to next problem after brief feedback
    setTimeout(() => {
      setShowFeedback(null);
      setAnswer("");

      if (currentIndex + 1 >= facts.length) {
        // Ran out of facts
        setIsComplete(true);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    }, 500);
  }, [answer, currentIndex, facts, showFeedback]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFinish = () => {
    onComplete(attemptedCount, correctCount);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  const currentFact = facts[currentIndex];

  // Start screen
  if (!isStarted) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">
            {focus === "mixed" ? "+" : focus === "addition" ? "+" : focus === "subtraction" ? "-" : focus === "multiplication" ? "x" : "+"}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Warm-Up Time!</h2>
          <p className="text-gray-600 mb-6">
            {duration} minute{duration > 1 ? "s" : ""} of {focus === "mixed" ? "mixed operations" : focus}
          </p>

          <div className="bg-yellow-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-yellow-800">
              Answer as many math facts as you can. Speed and accuracy both count!
            </p>
          </div>

          <button
            onClick={() => setIsStarted(true)}
            className="w-full bg-orange-500 text-white py-4 px-6 rounded-xl font-bold text-xl hover:bg-orange-600 transition-colors mb-3"
          >
            Start Warm-Up
          </button>

          {!required && onSkip && (
            <button
              onClick={onSkip}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    );
  }

  // Completion screen
  if (isComplete) {
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="text-6xl mb-4">
            {accuracy >= 90 ? "!" : accuracy >= 70 ? "!" : "!"}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {timeLeft === 0 ? "Time's Up!" : "Great Job!"}
          </h2>

          <div className="grid grid-cols-2 gap-4 my-6">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-3xl font-bold text-blue-600">{correctCount}</div>
              <div className="text-sm text-blue-800">Correct</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="text-3xl font-bold text-purple-600">{accuracy}%</div>
              <div className="text-sm text-purple-800">Accuracy</div>
            </div>
          </div>

          <div className="text-gray-600 mb-6">
            You answered {attemptedCount} problems in {formatTime(duration * 60 - timeLeft)}
          </div>

          <button
            onClick={handleFinish}
            className="w-full bg-green-500 text-white py-4 px-6 rounded-xl font-bold text-xl hover:bg-green-600 transition-colors"
          >
            Continue to Lesson
          </button>
        </div>
      </div>
    );
  }

  // Active warm-up screen
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
        {/* Timer and score */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-lg font-semibold text-gray-700">
            {correctCount}/{attemptedCount} correct
          </div>
          <div
            className={`text-2xl font-bold ${
              timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-gray-900"
            }`}
          >
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full mb-8">
          <div
            className="h-2 bg-blue-500 rounded-full transition-all duration-1000"
            style={{ width: `${((duration * 60 - timeLeft) / (duration * 60)) * 100}%` }}
          />
        </div>

        {/* Problem */}
        {currentFact && (
          <div className="text-center mb-8">
            <div
              className={`text-4xl font-bold mb-6 transition-colors ${
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
              <span className="text-4xl font-bold text-gray-900">=</span>
              <input
                type="text"
                inputMode="decimal"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className={`w-32 text-4xl font-bold text-center border-b-4 outline-none transition-colors ${
                  showFeedback === "correct"
                    ? "border-green-500 text-green-500"
                    : showFeedback === "incorrect"
                    ? "border-red-500 text-red-500"
                    : "border-blue-500 text-gray-900"
                }`}
                disabled={showFeedback !== null}
              />
            </div>

            {showFeedback === "incorrect" && (
              <div className="mt-4 text-red-500 font-medium">
                Correct answer: {currentFact.answer}
              </div>
            )}
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!answer.trim() || showFeedback !== null}
          className="w-full bg-blue-500 text-white py-4 px-6 rounded-xl font-bold text-xl hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
        >
          {showFeedback ? (showFeedback === "correct" ? "Correct!" : "Next") : "Submit"}
        </button>

        {/* End early button */}
        <button
          onClick={() => setIsComplete(true)}
          className="w-full mt-3 text-gray-500 hover:text-gray-700 text-sm"
        >
          End warm-up early
        </button>
      </div>
    </div>
  );
}
