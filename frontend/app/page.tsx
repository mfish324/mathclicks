"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ImageUploader } from "@/components/ImageUploader";
import { ReviewProblemsModal } from "@/components/ReviewProblemsModal";
import { ExtractionVerification } from "@/components/ExtractionVerification";
import { CreateClassModal } from "@/components/CreateClassModal";
import { SpeedChallenge } from "@/components/SpeedChallenge";
import { Sparkles, Clock, Trash2, PlayCircle, GraduationCap, Loader2, Users, Zap } from "lucide-react";
import type { ProcessImageResponse, ImageExtractionResult, ProblemSet } from "@/lib/types";
import {
  listSessions,
  deleteSession,
  setCurrentSessionId,
  type SessionSummary,
} from "@/lib/session-storage";
import { getOrCreateProfileWithMigration, type SpeedChallengeResult } from "@/lib/gamification";
import type { GradeLevel } from "@/lib/math-facts";

type FlowState = "idle" | "loading" | "verifying" | "navigating";

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSessions, setSavedSessions] = useState<SessionSummary[]>([]);
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showSpeedChallenge, setShowSpeedChallenge] = useState(false);
  const [speedChallengeGrade, setSpeedChallengeGrade] = useState<GradeLevel>(6);

  // New flow state management
  const [flowState, setFlowState] = useState<FlowState>("idle");
  const [apiComplete, setApiComplete] = useState(false);
  const [pendingExtraction, setPendingExtraction] = useState<ImageExtractionResult | null>(null);
  const [pendingProblems, setPendingProblems] = useState<ProblemSet | null>(null);
  const pendingFileRef = useRef<File | null>(null);

  // Load saved sessions on mount
  useEffect(() => {
    setSavedSessions(listSessions());
  }, []);

  const handleImageSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setFlowState("loading");
    setApiComplete(false);
    pendingFileRef.current = file;

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/process-image", {
        method: "POST",
        body: formData,
      });

      const data: ProcessImageResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || "Failed to process image");
      }

      // Store pending data for verification
      setPendingExtraction(data.data.extraction);
      setPendingProblems(data.data.problems);
      setApiComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
      setFlowState("idle");
    }
  };

  // Called when user finishes review and API is ready
  const handleReviewComplete = () => {
    setFlowState("verifying");
  };

  // Called when user confirms the extraction
  const handleVerificationConfirm = () => {
    if (pendingExtraction && pendingProblems) {
      sessionStorage.setItem("mathclicks-session", JSON.stringify({
        extraction: pendingExtraction,
        problems: pendingProblems,
      }));
      setFlowState("navigating");
      router.push("/practice");
    }
  };

  // Called when user wants to try a different image
  const handleVerificationRetry = () => {
    setFlowState("idle");
    setIsLoading(false);
    setApiComplete(false);
    setPendingExtraction(null);
    setPendingProblems(null);
    pendingFileRef.current = null;
  };

  const handleResumeSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    router.push("/practice");
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
    setSavedSessions(listSessions());
  };

  const handleCreateClass = async (gradeLevel: GradeLevel, warmUp: {
    enabled: boolean;
    duration: 1 | 2 | 3 | 5;
    focus: "addition" | "subtraction" | "multiplication" | "division" | "mixed";
    required: boolean;
  }) => {
    try {
      const response = await fetch("/api/class/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gradeLevel, warmUp }),
      });
      const data = await response.json();
      if (data.success && data.classCode) {
        router.push(`/teacher/${data.classCode}`);
      } else {
        throw new Error(data.error || "Failed to create class");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create class");
      throw err;
    }
  };

  const handleSpeedChallengeComplete = (result: SpeedChallengeResult) => {
    setShowSpeedChallenge(false);
    // The result is already saved by the SpeedChallenge component
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <main className="min-h-screen p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-100 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-5 h-5 text-[var(--primary)]" />
            <span className="text-[var(--primary)] font-semibold">Math Practice</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            MathClicks
          </h1>
          <p className="text-xl text-gray-600">
            Take a photo of your math lesson and practice with personalized problems!
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-[var(--error-light)] border border-[var(--error)] rounded-xl text-[var(--error)]">
            {error}
          </div>
        )}

        {/* Image Uploader */}
        <ImageUploader onImageSelect={handleImageSelect} isLoading={isLoading} />

        {/* Saved Sessions */}
        {savedSessions.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Continue Practice
            </h2>
            <div className="space-y-3">
              {savedSessions.slice(0, 5).map((session) => (
                <div
                  key={session.id}
                  className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{session.topic}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span>
                        {session.progress.correct}/{session.progress.total} correct
                      </span>
                      <span>
                        Problem {session.progress.current} of {session.progress.total}
                      </span>
                      <span>{formatDate(session.updatedAt)}</span>
                      {session.isComplete && (
                        <span className="text-green-600 font-medium">Completed</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResumeSession(session.id)}
                      className="btn-primary px-4 py-2 flex items-center gap-2"
                    >
                      <PlayCircle className="w-4 h-4" />
                      {session.isComplete ? "Review" : "Resume"}
                    </button>
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-12 text-center">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">How it works:</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6">
              <div className="text-3xl mb-3">📸</div>
              <h3 className="font-semibold mb-2">1. Capture</h3>
              <p className="text-gray-600 text-sm">Take a photo of your whiteboard or math notes</p>
            </div>
            <div className="card p-6">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="font-semibold mb-2">2. Generate</h3>
              <p className="text-gray-600 text-sm">AI creates practice problems based on your lesson</p>
            </div>
            <div className="card p-6">
              <div className="text-3xl mb-3">✨</div>
              <h3 className="font-semibold mb-2">3. Practice</h3>
              <p className="text-gray-600 text-sm">Solve problems and get instant feedback with hints</p>
            </div>
          </div>
        </div>

        {/* Speed Challenge Section */}
        <div className="mt-12 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">60-Second Math Blitz</h2>
                <p className="text-gray-600 text-sm">Test your math fact speed and earn XP!</p>
              </div>
            </div>
            <button
              onClick={() => setShowSpeedChallenge(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 text-white rounded-xl font-medium transition-opacity flex items-center gap-2"
            >
              <Zap className="w-5 h-5" />
              Start Challenge
            </button>
          </div>
        </div>

        {/* Teacher Section */}
        <div className="mt-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">For Teachers</h2>
                <p className="text-gray-600 text-sm">Create a class to monitor student progress in real-time</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateClassModal(true)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <Users className="w-5 h-5" />
              Create Class
            </button>
          </div>
        </div>

        {/* Build Info */}
        <div className="mt-8 text-center text-xs text-gray-400">
          Build: {process.env.NEXT_PUBLIC_BUILD_ID || "dev"}
        </div>
      </div>

      {/* Review Problems Modal - shown during image processing */}
      <ReviewProblemsModal
        isOpen={flowState === "loading"}
        apiComplete={apiComplete}
        onApiComplete={handleReviewComplete}
      />

      {/* Extraction Verification - shown after API completes */}
      {flowState === "verifying" && pendingExtraction && (
        <ExtractionVerification
          extraction={pendingExtraction}
          onConfirm={handleVerificationConfirm}
          onRetry={handleVerificationRetry}
        />
      )}

      {/* Create Class Modal */}
      <CreateClassModal
        isOpen={showCreateClassModal}
        onClose={() => setShowCreateClassModal(false)}
        onCreateClass={handleCreateClass}
      />

      {/* Speed Challenge */}
      {showSpeedChallenge && (
        <SpeedChallenge
          gradeLevel={speedChallengeGrade}
          onComplete={handleSpeedChallengeComplete}
          onClose={() => setShowSpeedChallenge(false)}
        />
      )}
    </main>
  );
}
