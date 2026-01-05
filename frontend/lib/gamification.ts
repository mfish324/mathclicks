/**
 * Gamification System
 * XP, levels, achievements, and streaks
 */

// ============ Types ============

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji or icon name
  xpBonus: number;
  unlockedAt?: string; // ISO date string when unlocked
}

export interface StudentProfile {
  id: string;
  createdAt: string;
  // XP & Levels
  totalXp: number;
  level: number;
  // Stats
  problemsCompleted: number;
  problemsCorrectFirstTry: number;
  canvasUsageCount: number;
  voiceExplanationCount: number;
  // Streaks
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string | null; // ISO date (YYYY-MM-DD)
  // Achievements
  achievements: Achievement[];
}

export interface XpAward {
  amount: number;
  reason: string;
  isBonus?: boolean;
}

export interface LevelUpResult {
  newLevel: number;
  previousLevel: number;
}

// ============ Constants ============

export const XP_PER_LEVEL = 100;

export const XP_AWARDS = {
  PROBLEM_COMPLETE: 10,
  FIRST_TRY_BONUS: 5,
  CANVAS_USED: 3,
  VOICE_EXPLANATION: 3,
  STREAK_DAY: 2,
} as const;

// ============ Achievements ============

export const ACHIEVEMENTS: Omit<Achievement, "unlockedAt">[] = [
  {
    id: "first_steps",
    name: "First Steps",
    description: "Complete your first problem",
    icon: "👶",
    xpBonus: 10,
  },
  {
    id: "getting_started",
    name: "Getting Started",
    description: "Complete 5 problems",
    icon: "🚀",
    xpBonus: 15,
  },
  {
    id: "problem_solver",
    name: "Problem Solver",
    description: "Complete 25 problems",
    icon: "🧮",
    xpBonus: 25,
  },
  {
    id: "math_master",
    name: "Math Master",
    description: "Complete 100 problems",
    icon: "🏆",
    xpBonus: 50,
  },
  {
    id: "show_your_work",
    name: "Show Your Work",
    description: "Use the canvas 5 times",
    icon: "✏️",
    xpBonus: 15,
  },
  {
    id: "artist",
    name: "Artist",
    description: "Use the canvas 25 times",
    icon: "🎨",
    xpBonus: 25,
  },
  {
    id: "voice_activated",
    name: "Voice Activated",
    description: "Record 3 voice explanations",
    icon: "🎤",
    xpBonus: 15,
  },
  {
    id: "explain_yourself",
    name: "Explain Yourself",
    description: "Record 10 voice explanations",
    icon: "🗣️",
    xpBonus: 25,
  },
  {
    id: "perfect_five",
    name: "Perfect Five",
    description: "Get 5 problems correct on first try",
    icon: "⭐",
    xpBonus: 20,
  },
  {
    id: "streak_starter",
    name: "Streak Starter",
    description: "Practice 3 days in a row",
    icon: "🔥",
    xpBonus: 15,
  },
  {
    id: "week_warrior",
    name: "Week Warrior",
    description: "Practice 7 days in a row",
    icon: "💪",
    xpBonus: 30,
  },
  {
    id: "level_up",
    name: "Level Up!",
    description: "Reach level 2",
    icon: "⬆️",
    xpBonus: 0, // Already getting XP from leveling
  },
  {
    id: "high_five",
    name: "High Five",
    description: "Reach level 5",
    icon: "🖐️",
    xpBonus: 25,
  },
];

// ============ Storage ============

const PROFILE_KEY = "mathclicks_student_profile";

function generateProfileId(): string {
  return `student_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

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

export function getProfile(): StudentProfile | null {
  if (!isStorageAvailable()) return null;
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: StudentProfile): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error("Failed to save profile:", error);
  }
}

export function createProfile(): StudentProfile {
  const profile: StudentProfile = {
    id: generateProfileId(),
    createdAt: new Date().toISOString(),
    totalXp: 0,
    level: 1,
    problemsCompleted: 0,
    problemsCorrectFirstTry: 0,
    canvasUsageCount: 0,
    voiceExplanationCount: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastPracticeDate: null,
    achievements: [],
  };
  saveProfile(profile);
  return profile;
}

export function getOrCreateProfile(): StudentProfile {
  const existing = getProfile();
  if (existing) return existing;
  return createProfile();
}

// ============ XP & Leveling ============

export function calculateLevel(totalXp: number): number {
  return Math.floor(totalXp / XP_PER_LEVEL) + 1;
}

export function getXpForCurrentLevel(totalXp: number): number {
  return totalXp % XP_PER_LEVEL;
}

export function getXpNeededForNextLevel(): number {
  return XP_PER_LEVEL;
}

export function awardXp(
  profile: StudentProfile,
  amount: number,
  reason: string
): { profile: StudentProfile; levelUp: LevelUpResult | null; awards: XpAward[] } {
  const previousLevel = profile.level;
  const newTotalXp = profile.totalXp + amount;
  const newLevel = calculateLevel(newTotalXp);

  const updatedProfile: StudentProfile = {
    ...profile,
    totalXp: newTotalXp,
    level: newLevel,
  };

  const awards: XpAward[] = [{ amount, reason }];

  const levelUp = newLevel > previousLevel
    ? { newLevel, previousLevel }
    : null;

  return { profile: updatedProfile, levelUp, awards };
}

// ============ Streaks ============

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function getYesterday(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split("T")[0];
}

export function updateStreak(profile: StudentProfile): {
  profile: StudentProfile;
  streakXp: number;
  isNewDay: boolean;
} {
  const today = getToday();
  const yesterday = getYesterday();

  // Already practiced today
  if (profile.lastPracticeDate === today) {
    return { profile, streakXp: 0, isNewDay: false };
  }

  let newStreak: number;
  let streakXp = 0;

  if (profile.lastPracticeDate === yesterday) {
    // Continue streak
    newStreak = profile.currentStreak + 1;
    streakXp = XP_AWARDS.STREAK_DAY * newStreak; // More XP for longer streaks
  } else {
    // Streak broken or first day
    newStreak = 1;
    streakXp = XP_AWARDS.STREAK_DAY;
  }

  const updatedProfile: StudentProfile = {
    ...profile,
    currentStreak: newStreak,
    longestStreak: Math.max(profile.longestStreak, newStreak),
    lastPracticeDate: today,
  };

  return { profile: updatedProfile, streakXp, isNewDay: true };
}

// ============ Achievements ============

export function checkAchievements(profile: StudentProfile): {
  profile: StudentProfile;
  newAchievements: Achievement[];
} {
  const unlockedIds = new Set(profile.achievements.map((a) => a.id));
  const newAchievements: Achievement[] = [];
  const now = new Date().toISOString();

  for (const achievement of ACHIEVEMENTS) {
    if (unlockedIds.has(achievement.id)) continue;

    let unlocked = false;

    switch (achievement.id) {
      case "first_steps":
        unlocked = profile.problemsCompleted >= 1;
        break;
      case "getting_started":
        unlocked = profile.problemsCompleted >= 5;
        break;
      case "problem_solver":
        unlocked = profile.problemsCompleted >= 25;
        break;
      case "math_master":
        unlocked = profile.problemsCompleted >= 100;
        break;
      case "show_your_work":
        unlocked = profile.canvasUsageCount >= 5;
        break;
      case "artist":
        unlocked = profile.canvasUsageCount >= 25;
        break;
      case "voice_activated":
        unlocked = profile.voiceExplanationCount >= 3;
        break;
      case "explain_yourself":
        unlocked = profile.voiceExplanationCount >= 10;
        break;
      case "perfect_five":
        unlocked = profile.problemsCorrectFirstTry >= 5;
        break;
      case "streak_starter":
        unlocked = profile.currentStreak >= 3;
        break;
      case "week_warrior":
        unlocked = profile.currentStreak >= 7;
        break;
      case "level_up":
        unlocked = profile.level >= 2;
        break;
      case "high_five":
        unlocked = profile.level >= 5;
        break;
    }

    if (unlocked) {
      const unlockedAchievement: Achievement = {
        ...achievement,
        unlockedAt: now,
      };
      newAchievements.push(unlockedAchievement);
    }
  }

  if (newAchievements.length > 0) {
    const updatedProfile: StudentProfile = {
      ...profile,
      achievements: [...profile.achievements, ...newAchievements],
    };
    return { profile: updatedProfile, newAchievements };
  }

  return { profile, newAchievements: [] };
}

// ============ Combined Action Handlers ============

export interface ProblemCompletedResult {
  profile: StudentProfile;
  xpAwarded: XpAward[];
  levelUp: LevelUpResult | null;
  newAchievements: Achievement[];
}

export function handleProblemCompleted(
  profile: StudentProfile,
  options: {
    correct: boolean;
    isFirstTry: boolean;
    usedCanvas: boolean;
    usedVoice: boolean;
  }
): ProblemCompletedResult {
  let currentProfile = { ...profile };
  const xpAwarded: XpAward[] = [];
  let levelUp: LevelUpResult | null = null;

  // Update stats
  currentProfile.problemsCompleted += 1;
  if (options.correct && options.isFirstTry) {
    currentProfile.problemsCorrectFirstTry += 1;
  }
  if (options.usedCanvas) {
    currentProfile.canvasUsageCount += 1;
  }
  if (options.usedVoice) {
    currentProfile.voiceExplanationCount += 1;
  }

  // Award XP for completing the problem
  if (options.correct) {
    const result = awardXp(currentProfile, XP_AWARDS.PROBLEM_COMPLETE, "Problem completed");
    currentProfile = result.profile;
    xpAwarded.push(...result.awards);
    if (result.levelUp) levelUp = result.levelUp;

    // Bonus XP for first try
    if (options.isFirstTry) {
      const bonusResult = awardXp(currentProfile, XP_AWARDS.FIRST_TRY_BONUS, "First try bonus!");
      currentProfile = bonusResult.profile;
      xpAwarded.push({ ...bonusResult.awards[0], isBonus: true });
      if (bonusResult.levelUp) levelUp = bonusResult.levelUp;
    }
  }

  // Award XP for using canvas
  if (options.usedCanvas) {
    const canvasResult = awardXp(currentProfile, XP_AWARDS.CANVAS_USED, "Showed your work");
    currentProfile = canvasResult.profile;
    xpAwarded.push(...canvasResult.awards);
    if (canvasResult.levelUp) levelUp = canvasResult.levelUp;
  }

  // Award XP for voice explanation
  if (options.usedVoice) {
    const voiceResult = awardXp(currentProfile, XP_AWARDS.VOICE_EXPLANATION, "Voice explanation");
    currentProfile = voiceResult.profile;
    xpAwarded.push(...voiceResult.awards);
    if (voiceResult.levelUp) levelUp = voiceResult.levelUp;
  }

  // Update streak
  const streakResult = updateStreak(currentProfile);
  currentProfile = streakResult.profile;
  if (streakResult.streakXp > 0) {
    const streakXpResult = awardXp(currentProfile, streakResult.streakXp, `${currentProfile.currentStreak} day streak!`);
    currentProfile = streakXpResult.profile;
    xpAwarded.push({ ...streakXpResult.awards[0], isBonus: true });
    if (streakXpResult.levelUp) levelUp = streakXpResult.levelUp;
  }

  // Check for new achievements
  const achievementResult = checkAchievements(currentProfile);
  currentProfile = achievementResult.profile;

  // Award XP for achievements
  for (const achievement of achievementResult.newAchievements) {
    if (achievement.xpBonus > 0) {
      const achievementXp = awardXp(currentProfile, achievement.xpBonus, `Achievement: ${achievement.name}`);
      currentProfile = achievementXp.profile;
      xpAwarded.push({ ...achievementXp.awards[0], isBonus: true });
      if (achievementXp.levelUp) levelUp = achievementXp.levelUp;
    }
  }

  // Save the profile
  saveProfile(currentProfile);

  return {
    profile: currentProfile,
    xpAwarded,
    levelUp,
    newAchievements: achievementResult.newAchievements,
  };
}
