/**
 * Session Storage Utility
 * Persists practice sessions to localStorage with automatic expiration
 */

import type { Problem, ImageExtractionResult, ProblemSet, ProblemAttempt } from "./types";

// Session data structure for storage
export interface StoredSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  topic: string;
  extraction: ImageExtractionResult;
  problems: Problem[];
  currentIndex: number;
  attempts: Record<string, number>;
  results: Record<string, boolean>;
  // Canvas work and attempt history per problem
  problemAttempts?: Record<string, ProblemAttempt[]>;
}

// Summary for listing sessions
export interface SessionSummary {
  id: string;
  topic: string;
  createdAt: string;
  updatedAt: string;
  progress: {
    current: number;
    total: number;
    correct: number;
  };
  isComplete: boolean;
}

const STORAGE_KEY = "mathclicks_sessions";
const CURRENT_SESSION_KEY = "mathclicks_current_session";
const SESSION_EXPIRY_DAYS = 7;

// Generate a unique session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Check if localStorage is available
function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

// Get all stored sessions
function getAllSessions(): Record<string, StoredSession> {
  if (!isStorageAvailable()) return {};
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

// Save all sessions
function saveAllSessions(sessions: Record<string, StoredSession>): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error("Failed to save sessions:", error);
  }
}

// Clean up expired sessions
function cleanupExpiredSessions(): void {
  const sessions = getAllSessions();
  const now = Date.now();
  const expiryMs = SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  let changed = false;

  for (const [id, session] of Object.entries(sessions)) {
    const updatedAt = new Date(session.updatedAt).getTime();
    if (now - updatedAt > expiryMs) {
      delete sessions[id];
      changed = true;
    }
  }

  if (changed) {
    saveAllSessions(sessions);
  }
}

/**
 * Create a new session from extraction and problem set
 */
export function createSession(
  extraction: ImageExtractionResult,
  problemSet: ProblemSet
): StoredSession {
  const now = new Date().toISOString();
  const session: StoredSession = {
    id: generateSessionId(),
    createdAt: now,
    updatedAt: now,
    topic: extraction.topic,
    extraction,
    problems: problemSet.problems,
    currentIndex: 0,
    attempts: {},
    results: {},
  };

  // Save to storage
  const sessions = getAllSessions();
  sessions[session.id] = session;
  saveAllSessions(sessions);

  // Set as current session
  setCurrentSessionId(session.id);

  return session;
}

/**
 * Update an existing session
 */
export function updateSession(
  sessionId: string,
  updates: Partial<Pick<StoredSession, "currentIndex" | "attempts" | "results" | "problemAttempts">>
): StoredSession | null {
  const sessions = getAllSessions();
  const session = sessions[sessionId];

  if (!session) return null;

  const updatedSession: StoredSession = {
    ...session,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  sessions[sessionId] = updatedSession;
  saveAllSessions(sessions);

  return updatedSession;
}

/**
 * Get a session by ID
 */
export function getSession(sessionId: string): StoredSession | null {
  const sessions = getAllSessions();
  return sessions[sessionId] || null;
}

/**
 * Delete a session
 */
export function deleteSession(sessionId: string): void {
  const sessions = getAllSessions();
  delete sessions[sessionId];
  saveAllSessions(sessions);

  // Clear current session if it was deleted
  if (getCurrentSessionId() === sessionId) {
    clearCurrentSessionId();
  }
}

/**
 * Get the current session ID
 */
export function getCurrentSessionId(): string | null {
  if (!isStorageAvailable()) return null;
  return localStorage.getItem(CURRENT_SESSION_KEY);
}

/**
 * Set the current session ID
 */
export function setCurrentSessionId(sessionId: string): void {
  if (!isStorageAvailable()) return;
  localStorage.setItem(CURRENT_SESSION_KEY, sessionId);
}

/**
 * Clear the current session ID
 */
export function clearCurrentSessionId(): void {
  if (!isStorageAvailable()) return;
  localStorage.removeItem(CURRENT_SESSION_KEY);
}

/**
 * Get the current session (convenience method)
 */
export function getCurrentSession(): StoredSession | null {
  const sessionId = getCurrentSessionId();
  if (!sessionId) return null;
  return getSession(sessionId);
}

/**
 * List all sessions as summaries (sorted by most recent)
 */
export function listSessions(): SessionSummary[] {
  cleanupExpiredSessions();
  const sessions = getAllSessions();

  return Object.values(sessions)
    .map((session) => {
      const correctCount = Object.values(session.results).filter(Boolean).length;
      const total = session.problems.length;
      const current = session.currentIndex + 1;
      const lastProblemCorrect = session.results[session.problems[session.currentIndex]?.id];
      const isComplete = current >= total && lastProblemCorrect;

      return {
        id: session.id,
        topic: session.topic,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        progress: {
          current,
          total,
          correct: correctCount,
        },
        isComplete,
      };
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Check if there are any saved sessions
 */
export function hasSavedSessions(): boolean {
  return listSessions().length > 0;
}

/**
 * Get incomplete sessions (for "Resume" functionality)
 */
export function getIncompleteSessions(): SessionSummary[] {
  return listSessions().filter((s) => !s.isComplete);
}

/**
 * Save a problem attempt (includes canvas work)
 */
export function saveProblemAttempt(
  sessionId: string,
  problemId: string,
  attempt: ProblemAttempt
): void {
  const session = getSession(sessionId);
  if (!session) return;

  const problemAttempts = session.problemAttempts || {};
  const attempts = problemAttempts[problemId] || [];
  attempts.push(attempt);
  problemAttempts[problemId] = attempts;

  updateSession(sessionId, { problemAttempts });
}

/**
 * Get attempts for a specific problem
 */
export function getProblemAttempts(
  sessionId: string,
  problemId: string
): ProblemAttempt[] {
  const session = getSession(sessionId);
  if (!session || !session.problemAttempts) return [];
  return session.problemAttempts[problemId] || [];
}

/**
 * Get the latest canvas image for a problem
 */
export function getLatestCanvasImage(
  sessionId: string,
  problemId: string
): string | null {
  const attempts = getProblemAttempts(sessionId, problemId);
  for (let i = attempts.length - 1; i >= 0; i--) {
    const canvasImage = attempts[i].canvasImage;
    if (canvasImage) {
      return canvasImage;
    }
  }
  return null;
}
