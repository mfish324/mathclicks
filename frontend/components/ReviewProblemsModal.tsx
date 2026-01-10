"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Check, Loader2, Brain, ArrowRight } from "lucide-react";
import { getReviewProblems, checkReviewAnswer, hasPreviousSessions, type ReviewProblem } from "@/lib/review-problems";

interface ReviewProblemsModalProps {
  isOpen: boolean;
  onApiComplete: () => void;
  apiComplete: boolean;
}

export function ReviewProblemsModal({ isOpen, onApiComplete, apiComplete }: ReviewProblemsModalProps) {
  const [problems, setProblems] = useState<ReviewProblem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [isFromPrevious, setIsFromPrevious] = useState(false);

  // Load problems on mount
  useEffect(() => {
    if (isOpen) {
      const reviewProblems = getReviewProblems(10);
      setProblems(reviewProblems);
      setIsFromPrevious(hasPreviousSessions());
      setCurrentIndex(0);
      setStats({ correct: 0, total: 0 });
      setAnswer("");
      setFeedback(null);
    }
  }, [isOpen]);

  const currentProblem = problems[currentIndex];

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProblem || !answer.trim()) return;

    const isCorrect = checkReviewAnswer(currentProblem, answer);
    setFeedback({
      correct: isCorrect,
      message: isCorrect
        ? ["Nice!", "Correct!", "Great job!", "Perfect!"][Math.floor(Math.random() * 4)]
        : `The answer was ${currentProblem.answer}`,
    });
    setStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));

    // Auto-advance after short delay
    setTimeout(() => {
      setFeedback(null);
      setAnswer("");
      if (currentIndex < problems.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }, isCorrect ? 800 : 1500);
  }, [currentProblem, answer, currentIndex, problems.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-6 h-6" />
              <div>
                <h2 className="font-bold text-lg">
                  {isFromPrevious ? "Review Time!" : "Warm Up!"}
                </h2>
                <p className="text-sm text-white/80">
                  {isFromPrevious
                    ? "Practice while we analyze your image"
                    : "Quick math facts while we prepare your problems"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {apiComplete ? (
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> Ready!
                </span>
              ) : (
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Analyzing...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Problem {Math.min(currentIndex + 1, problems.length)} of {problems.length}
          </span>
          <span className="font-medium text-indigo-600">
            {stats.correct}/{stats.total} correct
          </span>
        </div>

        {/* Problem Area */}
        <div className="p-6">
          {currentProblem ? (
            <div className="space-y-6">
              {/* Question */}
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-800 mb-2">
                  {currentProblem.question}
                </p>
              </div>

              {/* Feedback */}
              {feedback && (
                <div className={`text-center p-3 rounded-xl ${
                  feedback.correct
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}>
                  <p className="font-medium">{feedback.message}</p>
                </div>
              )}

              {/* Input */}
              {!feedback && (
                <form onSubmit={handleSubmit}>
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Your answer..."
                    className="w-full px-6 py-4 text-2xl text-center border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!answer.trim()}
                    className="w-full mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-medium rounded-xl transition-colors"
                  >
                    Check Answer
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              Loading problems...
            </div>
          )}
        </div>

        {/* Continue Button (when API complete) */}
        {apiComplete && (
          <div className="p-4 bg-gray-50 border-t">
            <button
              onClick={onApiComplete}
              className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Continue to Your Problems
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
