"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface TeacherSharingState {
  isSharing: boolean;
  studentName: string;
  classCode: string;
  studentId: string;
}

interface SessionData {
  topic: string;
  gradeLevel: number;
  problemsCompleted: number;
  problemsCorrect: number;
  currentProblemIndex: number;
  totalProblems: number;
  level: number;
  totalXp: number;
  currentStreak: number;
  isStuck: boolean;
  needsHelp: boolean;
  recentWork: Array<{
    problemId: string;
    problemText: string;
    attempts: number;
    correct: boolean;
    canvasImageUrl?: string;
    timestamp: string;
  }>;
}

const STORAGE_KEY = "mathclicks-teacher-sharing";

export function useTeacherSharing() {
  const [sharingState, setSharingState] = useState<TeacherSharingState>({
    isSharing: false,
    studentName: "",
    classCode: "",
    studentId: "",
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSessionDataRef = useRef<SessionData | null>(null);

  // Load saved state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSharingState(parsed);
      }
    } catch (e) {
      console.error("Error loading teacher sharing state:", e);
    }
    setIsInitialized(true);
  }, []);

  // Save state when it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sharingState));
    }
  }, [sharingState, isInitialized]);

  // Connect to a class
  const connectToClass = useCallback((studentName: string, classCode: string) => {
    const studentId = crypto.randomUUID();
    setSharingState({
      isSharing: true,
      studentName,
      classCode,
      studentId,
    });
  }, []);

  // Disconnect from class
  const disconnectFromClass = useCallback(() => {
    setSharingState({
      isSharing: false,
      studentName: "",
      classCode: "",
      studentId: "",
    });
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, []);

  // Sync session data to teacher
  const syncSession = useCallback(async (sessionData: SessionData) => {
    if (!sharingState.isSharing || !sharingState.classCode) {
      return;
    }

    lastSessionDataRef.current = sessionData;

    try {
      await fetch("/api/class/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classCode: sharingState.classCode,
          session: {
            id: sharingState.studentId,
            studentName: sharingState.studentName,
            classCode: sharingState.classCode,
            topic: sessionData.topic,
            gradeLevel: sessionData.gradeLevel,
            problemsCompleted: sessionData.problemsCompleted,
            problemsCorrect: sessionData.problemsCorrect,
            currentProblemIndex: sessionData.currentProblemIndex,
            totalProblems: sessionData.totalProblems,
            isActive: true,
            lastActivityAt: new Date().toISOString(),
            startedAt: new Date().toISOString(),
            level: sessionData.level,
            totalXp: sessionData.totalXp,
            currentStreak: sessionData.currentStreak,
            recentWork: sessionData.recentWork.slice(0, 5), // Last 5 problems
            isStuck: sessionData.isStuck,
            needsHelp: sessionData.needsHelp,
          },
        }),
      });
    } catch (error) {
      console.error("Error syncing session to teacher:", error);
    }
  }, [sharingState]);

  // Report achievement
  const reportAchievement = useCallback(async (achievementName: string, achievementIcon: string) => {
    if (!sharingState.isSharing || !sharingState.classCode) {
      return;
    }

    try {
      await fetch("/api/class/achievement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classCode: sharingState.classCode,
          studentName: sharingState.studentName,
          achievementName,
          achievementIcon,
        }),
      });
    } catch (error) {
      console.error("Error reporting achievement:", error);
    }
  }, [sharingState]);

  // Request help from teacher
  const requestHelp = useCallback(async (needsHelp: boolean) => {
    if (!sharingState.isSharing || !lastSessionDataRef.current) {
      return;
    }

    await syncSession({
      ...lastSessionDataRef.current,
      needsHelp,
    });
  }, [sharingState.isSharing, syncSession]);

  // Mark as stuck (called when 3+ attempts on same problem)
  const markStuck = useCallback(async (isStuck: boolean) => {
    if (!sharingState.isSharing || !lastSessionDataRef.current) {
      return;
    }

    await syncSession({
      ...lastSessionDataRef.current,
      isStuck,
    });
  }, [sharingState.isSharing, syncSession]);

  // Set up periodic sync when sharing is active
  useEffect(() => {
    if (sharingState.isSharing && isInitialized) {
      // Sync immediately on enable
      if (lastSessionDataRef.current) {
        syncSession(lastSessionDataRef.current);
      }

      // Set up periodic sync every 30 seconds
      syncIntervalRef.current = setInterval(() => {
        if (lastSessionDataRef.current) {
          syncSession(lastSessionDataRef.current);
        }
      }, 30000);

      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
          syncIntervalRef.current = null;
        }
      };
    }
  }, [sharingState.isSharing, isInitialized, syncSession]);

  return {
    isSharing: sharingState.isSharing,
    studentName: sharingState.studentName,
    classCode: sharingState.classCode,
    isInitialized,
    connectToClass,
    disconnectFromClass,
    syncSession,
    reportAchievement,
    requestHelp,
    markStuck,
  };
}
