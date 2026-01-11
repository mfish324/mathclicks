/**
 * In-Memory Class Store
 * Stores student sessions shared with teachers
 * TODO: Migrate to database (Supabase) for production
 */

// ============ Class Settings Types ============

export type GradeLevel = 4 | 5 | 6 | 7 | 8;
export type WarmUpFocus = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed';
export type WarmUpDuration = 1 | 2 | 3 | 5;

export interface WarmUpSettings {
  enabled: boolean;
  duration: WarmUpDuration; // minutes
  focus: WarmUpFocus;
  required: boolean; // If true, students must complete before lesson
}

export interface ClassSettings {
  classCode: string;
  gradeLevel: GradeLevel;
  createdAt: string;
  warmUp: WarmUpSettings;
}

// Grade level to max problem tier mapping
export const GRADE_TO_MAX_TIER: Record<GradeLevel, number> = {
  4: 3,
  5: 3,
  6: 4,
  7: 4,
  8: 5,
};

// Default warm-up settings
export const DEFAULT_WARMUP_SETTINGS: WarmUpSettings = {
  enabled: false,
  duration: 2,
  focus: 'mixed',
  required: false,
};

// ============ Student Session Types ============

export interface StudentSession {
  id: string;
  studentName: string;
  classCode: string;
  // Session data
  topic: string;
  gradeLevel: number;
  problemsCompleted: number;
  problemsCorrect: number;
  currentProblemIndex: number;
  totalProblems: number;
  // Status
  isActive: boolean;
  lastActivityAt: string;
  startedAt: string;
  // Gamification
  level: number;
  totalXp: number;
  currentStreak: number;
  // Work history (last 5 problems)
  recentWork: RecentWork[];
  // Flags
  isStuck: boolean; // 3+ attempts on current problem
  needsHelp: boolean; // Student requested help
}

export interface RecentWork {
  problemId: string;
  problemText: string;
  attempts: number;
  correct: boolean;
  canvasImageUrl?: string; // Base64 or URL
  timestamp: string;
}

export interface ClassSummary {
  classCode: string;
  activeStudents: number;
  totalStudents: number;
  studentsNeedingHelp: number;
  recentAchievements: RecentAchievement[];
}

export interface RecentAchievement {
  studentName: string;
  achievementName: string;
  achievementIcon: string;
  timestamp: string;
}

// In-memory storage
const classes: Map<string, Map<string, StudentSession>> = new Map();
const recentAchievements: Map<string, RecentAchievement[]> = new Map();
const classSettings: Map<string, ClassSettings> = new Map();

// Generate a simple class code
export function generateClassCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing characters
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Create or get a class
export function getOrCreateClass(classCode: string): Map<string, StudentSession> {
  if (!classes.has(classCode)) {
    classes.set(classCode, new Map());
    recentAchievements.set(classCode, []);
  }
  return classes.get(classCode)!;
}

// Update student session in a class
export function updateStudentSession(classCode: string, session: StudentSession): void {
  const classData = getOrCreateClass(classCode);
  classData.set(session.id, {
    ...session,
    lastActivityAt: new Date().toISOString(),
    isActive: true,
  });
}

// Mark student as inactive (no updates for 5 minutes)
export function markInactiveStudents(): void {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

  classes.forEach((classData) => {
    classData.forEach((session, id) => {
      const lastActivity = new Date(session.lastActivityAt).getTime();
      if (lastActivity < fiveMinutesAgo && session.isActive) {
        classData.set(id, { ...session, isActive: false });
      }
    });
  });
}

// Get all students in a class
export function getClassStudents(classCode: string): StudentSession[] {
  markInactiveStudents();
  const classData = classes.get(classCode);
  if (!classData) return [];
  return Array.from(classData.values()).sort((a, b) => {
    // Sort: needs help first, then stuck, then by last activity
    if (a.needsHelp !== b.needsHelp) return a.needsHelp ? -1 : 1;
    if (a.isStuck !== b.isStuck) return a.isStuck ? -1 : 1;
    return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
  });
}

// Get class summary
export function getClassSummary(classCode: string): ClassSummary {
  markInactiveStudents();
  const students = getClassStudents(classCode);
  const achievements = recentAchievements.get(classCode) || [];

  return {
    classCode,
    activeStudents: students.filter(s => s.isActive).length,
    totalStudents: students.length,
    studentsNeedingHelp: students.filter(s => s.needsHelp || s.isStuck).length,
    recentAchievements: achievements.slice(0, 10), // Last 10 achievements
  };
}

// Add achievement to class feed
export function addAchievement(
  classCode: string,
  studentName: string,
  achievementName: string,
  achievementIcon: string
): void {
  const achievements = recentAchievements.get(classCode) || [];
  achievements.unshift({
    studentName,
    achievementName,
    achievementIcon,
    timestamp: new Date().toISOString(),
  });
  // Keep only last 50 achievements
  if (achievements.length > 50) {
    achievements.pop();
  }
  recentAchievements.set(classCode, achievements);
}

// Get a specific student's session
export function getStudentSession(classCode: string, studentId: string): StudentSession | null {
  const classData = classes.get(classCode);
  if (!classData) return null;
  return classData.get(studentId) || null;
}

// Remove student from class
export function removeStudent(classCode: string, studentId: string): void {
  const classData = classes.get(classCode);
  if (classData) {
    classData.delete(studentId);
  }
}

// Check if class exists
export function classExists(classCode: string): boolean {
  return classes.has(classCode);
}

// ============ Class Settings Functions ============

// Create class with settings
export function createClassWithSettings(
  gradeLevel: GradeLevel,
  warmUp?: Partial<WarmUpSettings>
): ClassSettings {
  const classCode = generateClassCode();

  const settings: ClassSettings = {
    classCode,
    gradeLevel,
    createdAt: new Date().toISOString(),
    warmUp: {
      ...DEFAULT_WARMUP_SETTINGS,
      ...warmUp,
    },
  };

  classSettings.set(classCode, settings);
  getOrCreateClass(classCode); // Initialize student storage

  return settings;
}

// Get class settings
export function getClassSettings(classCode: string): ClassSettings | null {
  return classSettings.get(classCode) || null;
}

// Update class settings
export function updateClassSettings(
  classCode: string,
  updates: Partial<Omit<ClassSettings, 'classCode' | 'createdAt'>>
): ClassSettings | null {
  const existing = classSettings.get(classCode);
  if (!existing) return null;

  const updated: ClassSettings = {
    ...existing,
    ...updates,
    warmUp: updates.warmUp
      ? { ...existing.warmUp, ...updates.warmUp }
      : existing.warmUp,
  };

  classSettings.set(classCode, updated);
  return updated;
}

// Get max tier for a class (based on grade level)
export function getMaxTierForClass(classCode: string): number {
  const settings = classSettings.get(classCode);
  if (!settings) return 5; // Default to max if no settings
  return GRADE_TO_MAX_TIER[settings.gradeLevel];
}

// Check if warm-up is required for a class
export function isWarmUpRequired(classCode: string): boolean {
  const settings = classSettings.get(classCode);
  if (!settings) return false;
  return settings.warmUp.enabled && settings.warmUp.required;
}

// Get warm-up settings for a class
export function getWarmUpSettings(classCode: string): WarmUpSettings | null {
  const settings = classSettings.get(classCode);
  if (!settings) return null;
  return settings.warmUp;
}
