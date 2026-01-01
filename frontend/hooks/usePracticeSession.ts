"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Problem, ImageExtractionResult, ProblemSet, CheckAnswerResponse } from "@/lib/types";
import {
  createSession,
  updateSession,
  getCurrentSession,
  getCurrentSessionId,
  setCurrentSessionId,
  clearCurrentSessionId,
  getSession,
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
      });
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
    });

    return true;
  }, []);

  // End and clear the current session (but keep it in storage)
  const endSession = useCallback(() => {
    clearCurrentSessionId();
    setState(initialState);
  }, []);

  const getCurrentProblem = useCallback((): Problem | null => {
    return state.problems[state.currentIndex] || null;
  }, [state.problems, state.currentIndex]);

  const submitAnswer = useCallback(async (answer: string) => {
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
        body: JSON.stringify({ problem, studentAnswer: answer, attemptNumber }),
      });

      const data: CheckAnswerResponse = await response.json();

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
  }, [state.problems, state.currentIndex, state.attempts]);

  const nextProblem = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentIndex: Math.min(prev.currentIndex + 1, prev.problems.length - 1),
      lastFeedback: null,
    }));
  }, []);

  const clearFeedback = useCallback(() => {
    setState(prev => ({ ...prev, lastFeedback: null }));
  }, []);

  const getProgress = useCallback(() => ({
    current: state.currentIndex + 1,
    total: state.problems.length,
    correct: Object.values(state.results).filter(Boolean).length,
  }), [state.currentIndex, state.problems.length, state.results]);

  const isComplete = state.currentIndex >= state.problems.length - 1 && 
    state.results[state.problems[state.currentIndex]?.id];

  return {
    ...state,
    startSession,
    resumeSession,
    endSession,
    getCurrentProblem,
    submitAnswer,
    nextProblem,
    clearFeedback,
    getProgress,
    isComplete,
  };
}
