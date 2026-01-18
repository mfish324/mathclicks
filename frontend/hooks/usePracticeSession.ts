"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type {
  Problem,
  ImageExtractionResult,
  ProblemSet,
  CheckAnswerResponse,
  ProblemAttempt,
  MasteryUpdate,
  SelectionResult,
} from "@/lib/types";
import {
  createSession,
  updateSession,
  getCurrentSession,
  getCurrentSessionId,
  setCurrentSessionId,
  clearCurrentSessionId,
  getSession,
  saveProblemAttempt,
  type StoredSession,
} from "@/lib/session-storage";

interface PracticeSessionState {
  sessionId: string | null;
  extraction: ImageExtractionResult | null;
  problems: Problem[];
  currentIndex: number;
  attempts: Record<string, number>;
  results: Record<string, boolean>;
  isLoading: boolean;
  error: string | null;
  lastFeedback: CheckAnswerResponse | null;
  isRestored: boolean;
  isInitialized: boolean;
  // Mastery tracking
  currentTier: number;
  lastMasteryUpdate: MasteryUpdate | null;
  standardCode: string | null;
  studentId: string | null;
}

const initialState: PracticeSessionState = {
  sessionId: null,
  extraction: null,
  problems: [],
  currentIndex: 0,
  attempts: {},
  results: {},
  isLoading: false,
  error: null,
  lastFeedback: null,
  isRestored: false,
  isInitialized: false,
  // Mastery tracking
  currentTier: 3, // Default starting tier
  lastMasteryUpdate: null,
  standardCode: null,
  studentId: null,
};

export function usePracticeSession() {
  const [state, setState] = useState<PracticeSessionState>(initialState);
  const hasInitialized = useRef(false);

  // Restore session on mount (client-side only)
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const savedSession = getCurrentSession();
    if (savedSession) {
      setState({
        sessionId: savedSession.id,
        extraction: savedSession.extraction,
        problems: savedSession.problems,
        currentIndex: savedSession.currentIndex,
        attempts: savedSession.attempts,
        results: savedSession.results,
        isLoading: false,
        error: null,
        lastFeedback: null,
        isRestored: true,
        isInitialized: true,
      });
    } else {
      // No session found, but we've finished checking
      setState(prev => ({ ...prev, isInitialized: true }));
    }
  }, []);

  // Auto-save when session state changes
  useEffect(() => {
    if (!state.sessionId || !state.problems.length) return;

    updateSession(state.sessionId, {
      currentIndex: state.currentIndex,
      attempts: state.attempts,
      results: state.results,
    });
  }, [state.sessionId, state.currentIndex, state.attempts, state.results, state.problems.length]);

  const startSession = useCallback((extraction: ImageExtractionResult, problemSet: ProblemSet) => {
    // Create a new persisted session
    const session = createSession(extraction, problemSet);

    setState({
      ...initialState,
      sessionId: session.id,
      extraction,
      problems: problemSet.problems,
    });
  }, []);

  // Resume an existing session by ID
  const resumeSession = useCallback((sessionId: string) => {
    const session = getSession(sessionId);
    if (!session) {
      console.error("Session not found:", sessionId);
      return false;
    }

    setCurrentSessionId(sessionId);
    setState({
      sessionId: session.id,
      extraction: session.extraction,
      problems: session.problems,
      currentIndex: session.currentIndex,
      attempts: session.attempts,
      results: session.results,
      isLoading: false,
      error: null,
      lastFeedback: null,
      isRestored: true,
      isInitialized: true,
    });

    return true;
  }, []);

  // End and clear the current session (but keep it in storage)
  const endSession = useCallback(() => {
    clearCurrentSessionId();
    setState(initialState);
  }, []);

  // Add more problems to the current session (for progressive loading)
  const addProblems = useCallback((newProblems: Problem[]) => {
    setState(prev => {
      // Filter out any duplicates by ID
      const existingIds = new Set(prev.problems.map(p => p.id));
      const uniqueNewProblems = newProblems.filter(p => !existingIds.has(p.id));

      if (uniqueNewProblems.length === 0) return prev;

      return {
        ...prev,
        problems: [...prev.problems, ...uniqueNewProblems],
      };
    });
  }, []);

  const getCurrentProblem = useCallback((): Problem | null => {
    return state.problems[state.currentIndex] || null;
  }, [state.problems, state.currentIndex]);

  const submitAnswer = useCallback(async (answer: string, canvasImage?: string) => {
    const problem = state.problems[state.currentIndex];
    if (!problem) return;

    const attemptNumber = (state.attempts[problem.id] || 0) + 1;

    setState(prev => ({
      ...prev,
      isLoading: true,
      attempts: { ...prev.attempts, [problem.id]: attemptNumber },
    }));

    try {
      const response = await fetch("/api/check-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem, studentAnswer: answer, attemptNumber, canvasImage }),
      });

      const data: CheckAnswerResponse = await response.json();

      // Save the attempt with canvas work
      if (state.sessionId) {
        const attempt: ProblemAttempt = {
          problemId: problem.id,
          attemptNumber,
          answer,
          canvasImage,
          canvasUsed: !!canvasImage,
          timestamp: new Date().toISOString(),
          correct: data.correct,
          feedback: data.feedback,
        };
        saveProblemAttempt(state.sessionId, problem.id, attempt);
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        lastFeedback: data,
        results: data.correct ? { ...prev.results, [problem.id]: true } : prev.results,
      }));

      return data;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: "Failed to check answer",
      }));
      return null;
    }
  }, [state.problems, state.currentIndex, state.attempts, state.sessionId]);

  const nextProblem = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentIndex: Math.min(prev.currentIndex + 1, prev.problems.length - 1),
      lastFeedback: null,
    }));
  }, []);

  // Skip current problem without marking it correct (for problems that are too hard)
  const skipProblem = useCallback(() => {
    setState(prev => {
      const problem = prev.problems[prev.currentIndex];
      if (!problem) return prev;

      return {
        ...prev,
        currentIndex: Math.min(prev.currentIndex + 1, prev.problems.length - 1),
        lastFeedback: null,
        // Mark as attempted but not correct (skipped)
        results: { ...prev.results, [problem.id]: false },
      };
    });
  }, []);

  const clearFeedback = useCallback(() => {
    setState(prev => ({ ...prev, lastFeedback: null }));
  }, []);

  const getProgress = useCallback(() => ({
    current: state.currentIndex + 1,
    total: state.problems.length,
    correct: Object.values(state.results).filter(Boolean).length,
  }), [state.currentIndex, state.problems.length, state.results]);

  // ============ Mastery Tracking ============

  // Set student and standard for mastery tracking
  const setMasteryContext = useCallback((studentId: string, standardCode: string, initialTier?: number) => {
    setState(prev => ({
      ...prev,
      studentId,
      standardCode,
      currentTier: initialTier ?? prev.currentTier,
    }));
  }, []);

  // Record attempt with mastery update
  // If problem is AI-generated and correct, it will be auto-saved to database
  const recordAttemptWithMastery = useCallback(async (
    problemId: string,
    studentAnswer: string,
    isCorrect: boolean,
    options?: {
      timeSpentSeconds?: number;
      hintsUsed?: number;
      errorType?: string;
      feedbackGiven?: string;
      problem?: Problem; // Pass full problem for AI-generated auto-save
      problemSource?: "stored" | "ai_generated";
    }
  ): Promise<MasteryUpdate | null> => {
    if (!state.studentId || !state.standardCode) {
      console.warn("Mastery context not set, skipping mastery update");
      return null;
    }

    try {
      const response = await fetch(`/api/problems/${problemId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: state.studentId,
          standardCode: state.standardCode,
          studentAnswer,
          isCorrect,
          timeSpentSeconds: options?.timeSpentSeconds,
          hintsUsed: options?.hintsUsed,
          sessionId: state.sessionId,
          errorType: options?.errorType,
          feedbackGiven: options?.feedbackGiven,
          // For auto-saving AI problems on correct answer
          problem: options?.problemSource === "ai_generated" ? options.problem : undefined,
          problemSource: options?.problemSource,
        }),
      });

      if (!response.ok) {
        console.error("Failed to record attempt:", await response.text());
        return null;
      }

      const data = await response.json();
      const masteryUpdate = data.data?.masteryUpdate as MasteryUpdate | null;
      const savedProblemId = data.data?.savedProblemId as string | undefined;

      if (savedProblemId) {
        console.log(`AI problem auto-saved to database: ${savedProblemId}`);
      }

      if (masteryUpdate) {
        setState(prev => ({
          ...prev,
          currentTier: masteryUpdate.newTier,
          lastMasteryUpdate: masteryUpdate,
        }));
      }

      return masteryUpdate;
    } catch (error) {
      console.error("Error recording attempt:", error);
      return null;
    }
  }, [state.studentId, state.standardCode, state.sessionId]);

  // Select problems using adaptive selection
  const selectAdaptiveProblems = useCallback(async (
    standardCode: string,
    count: number = 5,
    options: { preferStored?: boolean; maxTier?: number } = {}
  ): Promise<SelectionResult | null> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch("/api/problems/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          standardCode,
          studentId: state.studentId,
          count,
          preferStored: options.preferStored ?? true,
          maxTier: options.maxTier,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to select problems");
      }

      const data = await response.json();
      const result = data.data as SelectionResult;

      // Update state with selected problems
      const problems = result.problems.map(sp => ({
        ...sp.problem,
        source: sp.source,
      }));

      setState(prev => ({
        ...prev,
        isLoading: false,
        problems,
        currentTier: result.metadata.studentTier,
        standardCode,
      }));

      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to select problems",
      }));
      return null;
    }
  }, [state.studentId]);

  // Get student's mastery summary
  const getMasterySummary = useCallback(async () => {
    if (!state.studentId) {
      return null;
    }

    try {
      const response = await fetch(`/api/student/${state.studentId}/mastery`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Error fetching mastery summary:", error);
      return null;
    }
  }, [state.studentId]);

  const isComplete = state.currentIndex >= state.problems.length - 1 &&
    state.results[state.problems[state.currentIndex]?.id];

  return {
    ...state,
    startSession,
    resumeSession,
    endSession,
    addProblems,
    getCurrentProblem,
    submitAnswer,
    nextProblem,
    skipProblem,
    clearFeedback,
    getProgress,
    isComplete,
    // Mastery tracking
    setMasteryContext,
    recordAttemptWithMastery,
    selectAdaptiveProblems,
    getMasterySummary,
  };
}
