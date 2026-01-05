"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, BookOpen, GraduationCap, Trophy, Loader2, Sparkles, Lightbulb, Smile, Share2, Users, X } from "lucide-react";
import { ProblemCard } from "@/components/ProblemCard";
import { WorkArea } from "@/components/WorkArea";
import { FeedbackDisplay } from "@/components/FeedbackDisplay";
import { SocraticDialogue } from "@/components/SocraticDialogue";
import { ProgressBar } from "@/components/ProgressBar";
import { XpDisplay } from "@/components/XpDisplay";
import { XpPopup } from "@/components/XpPopup";
import { ShareWithTeacher } from "@/components/ShareWithTeacher";
import { usePracticeSession } from "@/hooks/usePracticeSession";
import { useTeacherSharing } from "@/hooks/useTeacherSharing";
import { getFunComment } from "@/lib/fun-comments";
import {
  getOrCreateProfile,
  handleProblemCompleted,
  type StudentProfile,
  type XpAward,
  type LevelUpResult,
  type Achievement,
} from "@/lib/gamification";
import type { ImageExtractionResult, ProblemSet, Problem } from "@/lib/types";

interface SocraticQuestion {
  question: string;
  category: "understanding" | "process" | "reasoning" | "connection";
  encouragement: string;
}

export default function PracticePage() {
  const router = useRouter();
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [loadingMoreProblems, setLoadingMoreProblems] = useState(false);
  const [funComment, setFunComment] = useState<{ message: string; type: "encouragement" | "realWorld" | "dadJoke" } | null>(null);
  const [showFunComment, setShowFunComment] = useState(true);
  const hasStartedBackgroundLoad = useRef(false);

  // Socratic dialogue state
  const [socraticQuestion, setSocraticQuestion] = useState<SocraticQuestion | null>(null);
  const [isAnalyzingWork, setIsAnalyzingWork] = useState(false);
  const [currentCanvasImage, setCurrentCanvasImage] = useState<string | null>(null);
  const [dialogueFeedback, setDialogueFeedback] = useState<string | undefined>();
  const [followUpQuestion, setFollowUpQuestion] = useState<string | undefined>();
  const [readyToSubmit, setReadyToSubmit] = useState(false);
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([]);

  // Gamification state
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [showXpPopup, setShowXpPopup] = useState(false);
  const [pendingXpAwards, setPendingXpAwards] = useState<XpAward[]>([]);
  const [pendingLevelUp, setPendingLevelUp] = useState<LevelUpResult | null>(null);
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([]);
  const [usedCanvasThisProblem, setUsedCanvasThisProblem] = useState(false);
  const [usedVoiceThisProblem, setUsedVoiceThisProblem] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Teacher sharing hook
  const {
    isSharing,
    studentName,
    classCode,
    connectToClass,
    disconnectFromClass,
    syncSession,
    reportAchievement,
    markStuck,
  } = useTeacherSharing();

  const {
    extraction,
    problems,
    currentIndex,
    attempts,
    isLoading,
    lastFeedback,
    isRestored,
    isInitialized,
    startSession,
    endSession,
    addProblems,
    getCurrentProblem,
    submitAnswer,
    nextProblem,
    skipProblem,
    clearFeedback,
    getProgress,
    isComplete,
  } = usePracticeSession();

  useEffect(() => {
    // Wait for the hook to finish checking localStorage
    if (!isInitialized) return;

    // Check for NEW session data from image upload FIRST
    // This takes priority over restored sessions (user uploaded a new image)
    const sessionData = sessionStorage.getItem("mathclicks-session");
    if (sessionData) {
      try {
        const { extraction, problems } = JSON.parse(sessionData);
        startSession(extraction, problems);
        setSessionLoaded(true);
        // Clear after loading
        sessionStorage.removeItem("mathclicks-session");
        return;
      } catch {
        router.push("/");
        return;
      }
    }

    // If no new upload, check if session was restored from localStorage
    if (isRestored && extraction) {
      setSessionLoaded(true);
      return;
    }

    // No session data and nothing restored - go back to home
    router.push("/");
  }, [router, startSession, isRestored, isInitialized, extraction]);

  // Load profile on mount
  useEffect(() => {
    const studentProfile = getOrCreateProfile();
    setProfile(studentProfile);
  }, []);

  // Sync session data with teacher when sharing is enabled
  useEffect(() => {
    if (!isSharing || !extraction || !profile || !sessionLoaded) return;

    // Build recent work from attempts
    const recentWork = problems.slice(0, 5).map((p) => ({
      problemId: p.id,
      problemText: p.problem_text.substring(0, 100),
      attempts: attempts[p.id] || 0,
      correct: !!lastFeedback?.correct && getCurrentProblem()?.id === p.id,
      timestamp: new Date().toISOString(),
    }));

    const progress = getProgress();
    const currentAttempts = currentProblem ? (attempts[currentProblem.id] || 0) : 0;

    syncSession({
      topic: extraction.topic,
      gradeLevel: extraction.grade_level,
      problemsCompleted: progress.correct + (progress.total - progress.correct - 1),
      problemsCorrect: progress.correct,
      currentProblemIndex: currentIndex,
      totalProblems: progress.total,
      level: profile.level,
      totalXp: profile.totalXp,
      currentStreak: profile.currentStreak,
      isStuck: currentAttempts >= 3,
      needsHelp: false,
      recentWork,
    });
  }, [isSharing, sessionLoaded, extraction, profile, currentIndex, attempts, lastFeedback]);

  // Generate fun comment when session loads
  useEffect(() => {
    if (sessionLoaded && extraction && !funComment) {
      const comment = getFunComment(extraction.topic, extraction.standards);
      setFunComment(comment);
      setShowFunComment(true);
      // Auto-hide after 8 seconds
      const timer = setTimeout(() => setShowFunComment(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [sessionLoaded, extraction, funComment]);

  // Load more problems in the background (Tiers 2-5)
  useEffect(() => {
    if (!sessionLoaded || !extraction || hasStartedBackgroundLoad.current) return;
    if (isRestored) return; // Don't load more for restored sessions

    hasStartedBackgroundLoad.current = true;
    setLoadingMoreProblems(true);

    // Load tiers 2-5 in parallel
    const loadMoreTiers = async () => {
      const tiers = [2, 3, 4, 5];

      try {
        const results = await Promise.all(
          tiers.map(tier =>
            fetch("/api/generate-more", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ extraction, tier, count: 3 }),
            }).then(res => res.json())
          )
        );

        // Add problems from each tier as they complete
        for (const result of results) {
          if (result.success && result.data?.problems?.problems) {
            addProblems(result.data.problems.problems);
          }
        }
      } catch (error) {
        console.error("Failed to load additional problems:", error);
      } finally {
        setLoadingMoreProblems(false);
      }
    };

    loadMoreTiers();
  }, [sessionLoaded, extraction, isRestored, addProblems]);

  const currentProblem = getCurrentProblem();
  const progress = getProgress();

  if (!sessionLoaded || !extraction || !currentProblem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  const handleSubmit = async (answer: string, canvasImage?: string) => {
    // Track canvas usage
    if (canvasImage) {
      setUsedCanvasThisProblem(true);
    }

    const result = await submitAnswer(answer, canvasImage);

    // Award XP if correct
    if (result?.correct && profile && currentProblem) {
      const attemptNumber = attempts[currentProblem.id] || 1;
      const isFirstTry = attemptNumber === 1;

      const xpResult = handleProblemCompleted(profile, {
        correct: true,
        isFirstTry,
        usedCanvas: usedCanvasThisProblem || !!canvasImage,
        usedVoice: usedVoiceThisProblem,
      });

      setProfile(xpResult.profile);

      // Show XP popup if there are rewards
      if (xpResult.xpAwarded.length > 0 || xpResult.levelUp || xpResult.newAchievements.length > 0) {
        setPendingXpAwards(xpResult.xpAwarded);
        setPendingLevelUp(xpResult.levelUp);
        setPendingAchievements(xpResult.newAchievements);
        setShowXpPopup(true);

        // Report achievements to teacher if sharing
        if (isSharing) {
          for (const achievement of xpResult.newAchievements) {
            reportAchievement(achievement.name, achievement.icon);
          }
        }
      }
    }
  };

  const handleNext = () => {
    nextProblem();
  };

  const handleTryAgain = () => {
    clearFeedback();
  };

  const handleSkip = () => {
    skipProblem();
    // Reset Socratic state when moving to next problem
    resetSocraticState();
  };

  const resetSocraticState = () => {
    setSocraticQuestion(null);
    setCurrentCanvasImage(null);
    setDialogueFeedback(undefined);
    setFollowUpQuestion(undefined);
    setReadyToSubmit(false);
    setPreviousQuestions([]);
    // Reset tracking for next problem
    setUsedCanvasThisProblem(false);
    setUsedVoiceThisProblem(false);
  };

  const handleCheckWork = async (canvasImage: string) => {
    if (!currentProblem) return;

    setIsAnalyzingWork(true);
    setCurrentCanvasImage(canvasImage);

    try {
      const response = await fetch("/api/analyze-work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: currentProblem,
          canvasImage,
          previousQuestions,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setSocraticQuestion(result.data);
        setPreviousQuestions((prev) => [...prev, result.data.question]);

        if (result.readyToSubmit) {
          setReadyToSubmit(true);
        }
      } else {
        console.error("Failed to analyze work:", result.error);
      }
    } catch (error) {
      console.error("Error analyzing work:", error);
    } finally {
      setIsAnalyzingWork(false);
    }
  };

  const handleSocraticResponse = async (response: string, isVoice = false) => {
    if (!currentProblem || !currentCanvasImage || !socraticQuestion) return;

    setIsAnalyzingWork(true);

    try {
      const apiResponse = await fetch("/api/evaluate-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: currentProblem,
          canvasImage: currentCanvasImage,
          aiQuestion: followUpQuestion || socraticQuestion.question,
          studentResponse: response,
        }),
      });

      const result = await apiResponse.json();

      if (result.success) {
        setDialogueFeedback(result.feedback);

        if (result.followUpQuestion) {
          setFollowUpQuestion(result.followUpQuestion);
          setPreviousQuestions((prev) => [...prev, result.followUpQuestion!]);
        } else {
          setFollowUpQuestion(undefined);
        }

        if (result.readyToSubmit) {
          setReadyToSubmit(true);
        }

        // Track voice usage for gamification XP bonus
        if (isVoice) {
          setUsedVoiceThisProblem(true);
        }
      } else {
        console.error("Failed to evaluate response:", result.error);
      }
    } catch (error) {
      console.error("Error evaluating response:", error);
    } finally {
      setIsAnalyzingWork(false);
    }
  };

  const handleReadyToSubmit = () => {
    // Close the Socratic dialogue and let user submit their answer
    setSocraticQuestion(null);
    setDialogueFeedback(undefined);
    setFollowUpQuestion(undefined);
    setReadyToSubmit(false);
    // Keep the canvas image so it can be submitted with the answer
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
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>

            {/* Share with Teacher button */}
            {isSharing ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">{studentName}</span>
                  <span className="text-green-600">• {classCode}</span>
                </div>
                <button
                  onClick={disconnectFromClass}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  title="Stop sharing"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-full text-sm font-medium transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share with Teacher
              </button>
            )}
          </div>

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

          {/* Fun Comment */}
          <AnimatePresence>
            {funComment && showFunComment && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className={`p-4 rounded-xl flex items-start gap-3 ${
                  funComment.type === "dadJoke"
                    ? "bg-amber-50 border border-amber-200"
                    : funComment.type === "realWorld"
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-green-50 border border-green-200"
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    funComment.type === "dadJoke"
                      ? "bg-amber-100"
                      : funComment.type === "realWorld"
                      ? "bg-blue-100"
                      : "bg-green-100"
                  }`}>
                    {funComment.type === "dadJoke" ? (
                      <Smile className="w-4 h-4 text-amber-600" />
                    ) : funComment.type === "realWorld" ? (
                      <Lightbulb className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <p className={`text-sm flex-1 ${
                    funComment.type === "dadJoke"
                      ? "text-amber-800"
                      : funComment.type === "realWorld"
                      ? "text-blue-800"
                      : "text-green-800"
                  }`}>
                    {funComment.message}
                  </p>
                  <button
                    onClick={() => setShowFunComment(false)}
                    className="text-gray-400 hover:text-gray-600 text-xs"
                  >
                    dismiss
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* XP Display */}
          {profile && (
            <div className="mb-4">
              <XpDisplay
                totalXp={profile.totalXp}
                level={profile.level}
                currentStreak={profile.currentStreak}
                compact
              />
            </div>
          )}

          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <ProgressBar {...progress} />
            </div>
            {loadingMoreProblems && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Loading more...</span>
              </div>
            )}
          </div>
        </div>

        {/* Problem Card */}
        <AnimatePresence mode="wait">
          <ProblemCard key={currentProblem.id} problem={currentProblem}>
            {lastFeedback ? (
              <FeedbackDisplay
                correct={lastFeedback.correct}
                feedback={lastFeedback.feedback}
                hint={lastFeedback.hint_text}
                onNext={() => {
                  handleNext();
                  resetSocraticState();
                }}
                onTryAgain={handleTryAgain}
              />
            ) : socraticQuestion ? (
              <SocraticDialogue
                question={socraticQuestion}
                onRespond={handleSocraticResponse}
                onReadyToSubmit={handleReadyToSubmit}
                isLoading={isAnalyzingWork}
                feedback={dialogueFeedback}
                followUpQuestion={followUpQuestion}
                readyToSubmit={readyToSubmit}
              />
            ) : (
              <WorkArea
                onSubmit={handleSubmit}
                onSkip={handleSkip}
                onCheckWork={handleCheckWork}
                disabled={isLoading || isAnalyzingWork}
                showCheckWork={true}
                problemId={currentProblem.id}
              />
            )}
          </ProblemCard>
        </AnimatePresence>
      </div>

      {/* XP Popup */}
      {showXpPopup && (
        <XpPopup
          awards={pendingXpAwards}
          levelUp={pendingLevelUp}
          newAchievements={pendingAchievements}
          onComplete={() => {
            setShowXpPopup(false);
            setPendingXpAwards([]);
            setPendingLevelUp(null);
            setPendingAchievements([]);
          }}
        />
      )}

      {/* Share with Teacher Modal */}
      <ShareWithTeacher
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onConnect={(name, code) => {
          connectToClass(name, code);
          setShowShareModal(false);
        }}
        currentStudentName={studentName}
        currentClassCode={classCode}
      />
    </main>
  );
}
