"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, GraduationCap, Trophy } from "lucide-react";
import { ProblemCard } from "@/components/ProblemCard";
import { AnswerInput } from "@/components/AnswerInput";
import { FeedbackDisplay } from "@/components/FeedbackDisplay";
import { ProgressBar } from "@/components/ProgressBar";
import { usePracticeSession } from "@/hooks/usePracticeSession";
import type { ImageExtractionResult, ProblemSet } from "@/lib/types";

export default function PracticePage() {
  const router = useRouter();
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const {
    extraction,
    problems,
    currentIndex,
    isLoading,
    lastFeedback,
    isRestored,
    startSession,
    endSession,
    getCurrentProblem,
    submitAnswer,
    nextProblem,
    clearFeedback,
    getProgress,
    isComplete,
  } = usePracticeSession();

  useEffect(() => {
    // If session was restored from localStorage, we're good
    if (isRestored && extraction) {
      setSessionLoaded(true);
      // Clear any temporary sessionStorage data
      sessionStorage.removeItem("mathclicks-session");
      return;
    }

    // Otherwise, check for new session data from image upload
    const sessionData = sessionStorage.getItem("mathclicks-session");
    if (sessionData) {
      try {
        const { extraction, problems } = JSON.parse(sessionData);
        startSession(extraction, problems);
        setSessionLoaded(true);
        // Clear after loading
        sessionStorage.removeItem("mathclicks-session");
      } catch {
        router.push("/");
      }
    } else if (!isRestored) {
      // No session data and nothing restored - go back to home
      router.push("/");
    }
  }, [router, startSession, isRestored, extraction]);

  const currentProblem = getCurrentProblem();
  const progress = getProgress();

  if (!sessionLoaded || !extraction || !currentProblem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  const handleSubmit = async (answer: string) => {
    await submitAnswer(answer);
  };

  const handleNext = () => {
    nextProblem();
  };

  const handleTryAgain = () => {
    clearFeedback();
  };

  if (isComplete) {
    return (
      <main className="min-h-screen p-6 md:p-12">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-8 text-center"
          >
            <Trophy className="w-20 h-20 text-[var(--hint)] mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Great job!</h1>
            <p className="text-xl text-gray-600 mb-6">
              You completed all {progress.total} problems!
            </p>
            <div className="text-4xl font-bold text-[var(--success)] mb-8">
              {progress.correct} / {progress.total} correct
            </div>
            <button
              onClick={() => {
                endSession();
                router.push("/");
              }}
              className="btn btn-primary"
            >
              Practice More
            </button>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          {/* Topic Info */}
          <div className="card p-4 mb-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-gray-800">{extraction.topic}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    <GraduationCap className="w-3 h-3" />
                    Grade {extraction.grade_level}
                  </span>
                  {extraction.standards.slice(0, 2).map((standard) => (
                    <span key={standard} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      {standard}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Progress */}
          <ProgressBar {...progress} />
        </div>

        {/* Problem Card */}
        <AnimatePresence mode="wait">
          <ProblemCard key={currentProblem.id} problem={currentProblem}>
            {lastFeedback ? (
              <FeedbackDisplay
                correct={lastFeedback.correct}
                feedback={lastFeedback.feedback}
                hint={lastFeedback.hint_text}
                onNext={handleNext}
                onTryAgain={handleTryAgain}
              />
            ) : (
              <AnswerInput onSubmit={handleSubmit} disabled={isLoading} />
            )}
          </ProblemCard>
        </AnimatePresence>
      </div>
    </main>
  );
}
