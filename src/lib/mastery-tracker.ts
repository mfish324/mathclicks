/**
 * Mastery Tracker
 * Tracks and updates student mastery per standard for adaptive problem selection
 */

import { getSupabaseAdmin, isSupabaseConfigured } from './supabase';
import { getStandardIdByCode } from './standards-service';
import type { StudentMastery, ProblemAttemptInsert } from '../types/database';

// Adaptive progression thresholds
const TIER_UP_THRESHOLD = 3; // Consecutive correct answers to tier up
const TIER_DOWN_THRESHOLD = 2; // Consecutive incorrect answers to tier down
const MIN_TIER = 1;
const MAX_TIER = 5;

export interface MasteryUpdate {
  previousTier: number;
  newTier: number;
  tierChanged: boolean;
  direction: 'up' | 'down' | 'none';
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
}

export interface AttemptRecord {
  studentId: string;
  problemId?: string;
  standardCode: string;
  studentAnswer: string;
  isCorrect: boolean;
  timeSpentSeconds?: number;
  hintsUsed?: number;
  sessionId?: string;
  errorType?: string;
  feedbackGiven?: string;
}

/**
 * Get or create mastery record for a student and standard
 */
export async function getOrCreateMastery(
  studentId: string,
  standardCode: string,
  initialTier: number = 1
): Promise<StudentMastery | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const standardId = await getStandardIdByCode(standardCode);
  if (!standardId) {
    console.warn(`Standard not found: ${standardCode}`);
    return null;
  }

  const supabase = getSupabaseAdmin();

  // Try to get existing record
  const { data: existing } = await supabase
    .from('student_standard_mastery')
    .select('*')
    .eq('student_id', studentId)
    .eq('standard_id', standardId)
    .single();

  if (existing) {
    return existing;
  }

  // Create new record
  const { data: created, error } = await supabase
    .from('student_standard_mastery')
    .insert({
      student_id: studentId,
      standard_id: standardId,
      current_tier: initialTier,
      problems_attempted: 0,
      problems_correct: 0,
      consecutive_correct: 0,
      consecutive_incorrect: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create mastery record:', error);
    return null;
  }

  return created;
}

/**
 * Get mastery for a specific student and standard
 */
export async function getMasteryForStudent(
  studentId: string,
  standardCode: string
): Promise<StudentMastery | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const standardId = await getStandardIdByCode(standardCode);
  if (!standardId) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('student_standard_mastery')
    .select('*')
    .eq('student_id', studentId)
    .eq('standard_id', standardId)
    .single();

  return data || null;
}

/**
 * Get all mastery records for a student
 */
export async function getAllMasteryForStudent(
  studentId: string
): Promise<StudentMastery[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('student_standard_mastery')
    .select('*')
    .eq('student_id', studentId);

  if (error) {
    console.error('Failed to fetch mastery records:', error);
    return [];
  }

  return data || [];
}

/**
 * Record a problem attempt and update mastery
 *
 * Adaptive logic:
 * - 3 consecutive correct → tier up
 * - 2 consecutive incorrect → tier down
 */
export async function recordAttempt(
  attempt: AttemptRecord
): Promise<MasteryUpdate | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const standardId = await getStandardIdByCode(attempt.standardCode);
  if (!standardId) {
    console.warn(`Standard not found: ${attempt.standardCode}`);
    return null;
  }

  const supabase = getSupabaseAdmin();

  // Record the attempt
  const attemptInsert: ProblemAttemptInsert = {
    student_id: attempt.studentId,
    problem_id: attempt.problemId,
    standard_id: standardId,
    student_answer: attempt.studentAnswer,
    is_correct: attempt.isCorrect,
    time_spent_seconds: attempt.timeSpentSeconds,
    hints_used: attempt.hintsUsed || 0,
    session_id: attempt.sessionId,
    error_type: attempt.errorType,
    feedback_given: attempt.feedbackGiven,
  };

  // Get current mastery to record tier at attempt
  const currentMastery = await getOrCreateMastery(
    attempt.studentId,
    attempt.standardCode
  );

  if (currentMastery) {
    attemptInsert.tier_at_attempt = currentMastery.current_tier;
  }

  const { error: attemptError } = await supabase
    .from('problem_attempts')
    .insert(attemptInsert);

  if (attemptError) {
    console.error('Failed to record attempt:', attemptError);
  }

  // Update mastery
  if (!currentMastery) {
    return null;
  }

  const previousTier = currentMastery.current_tier;
  let newTier = previousTier;
  let consecutiveCorrect = currentMastery.consecutive_correct;
  let consecutiveIncorrect = currentMastery.consecutive_incorrect;

  if (attempt.isCorrect) {
    consecutiveCorrect++;
    consecutiveIncorrect = 0;

    // Check for tier up
    if (consecutiveCorrect >= TIER_UP_THRESHOLD && previousTier < MAX_TIER) {
      newTier = Math.min(previousTier + 1, MAX_TIER);
      consecutiveCorrect = 0; // Reset after tier change
    }
  } else {
    consecutiveIncorrect++;
    consecutiveCorrect = 0;

    // Check for tier down
    if (consecutiveIncorrect >= TIER_DOWN_THRESHOLD && previousTier > MIN_TIER) {
      newTier = Math.max(previousTier - 1, MIN_TIER);
      consecutiveIncorrect = 0; // Reset after tier change
    }
  }

  const tierChanged = newTier !== previousTier;

  // Update mastery record
  const updateData: Partial<StudentMastery> = {
    problems_attempted: currentMastery.problems_attempted + 1,
    problems_correct: attempt.isCorrect
      ? currentMastery.problems_correct + 1
      : currentMastery.problems_correct,
    consecutive_correct: consecutiveCorrect,
    consecutive_incorrect: consecutiveIncorrect,
    current_tier: newTier,
    last_practiced_at: new Date().toISOString(),
  };

  if (tierChanged) {
    updateData.last_tier_change_at = new Date().toISOString();
    if (newTier > previousTier) {
      updateData.times_tier_up = (currentMastery.times_tier_up || 0) + 1;
    } else {
      updateData.times_tier_down = (currentMastery.times_tier_down || 0) + 1;
    }
  }

  // Calculate average time if time was provided
  if (attempt.timeSpentSeconds) {
    const prevAvg = currentMastery.avg_time_seconds || 0;
    const prevCount = currentMastery.problems_attempted;
    updateData.avg_time_seconds = Math.round(
      (prevAvg * prevCount + attempt.timeSpentSeconds) / (prevCount + 1)
    );
  }

  const { error: updateError } = await supabase
    .from('student_standard_mastery')
    .update(updateData)
    .eq('id', currentMastery.id);

  if (updateError) {
    console.error('Failed to update mastery:', updateError);
  }

  return {
    previousTier,
    newTier,
    tierChanged,
    direction: tierChanged ? (newTier > previousTier ? 'up' : 'down') : 'none',
    consecutiveCorrect,
    consecutiveIncorrect,
  };
}

/**
 * Get recent attempts for a student
 */
export async function getRecentAttempts(
  studentId: string,
  limit: number = 20
): Promise<
  Array<{
    id: string;
    student_answer: string;
    is_correct: boolean;
    created_at: string;
    standard_id: string | null;
    tier_at_attempt: number | null;
  }>
> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('problem_attempts')
    .select('id, student_answer, is_correct, created_at, standard_id, tier_at_attempt')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch recent attempts:', error);
    return [];
  }

  return data || [];
}

/**
 * Get mastery summary for a student across all standards
 */
export async function getMasterySummary(studentId: string): Promise<{
  totalStandardsPracticed: number;
  averageTier: number;
  totalProblemsAttempted: number;
  totalProblemsCorrect: number;
  overallAccuracy: number;
  strongestStandards: Array<{ standardId: string; tier: number; accuracy: number }>;
  weakestStandards: Array<{ standardId: string; tier: number; accuracy: number }>;
}> {
  const masteryRecords = await getAllMasteryForStudent(studentId);

  if (masteryRecords.length === 0) {
    return {
      totalStandardsPracticed: 0,
      averageTier: 1,
      totalProblemsAttempted: 0,
      totalProblemsCorrect: 0,
      overallAccuracy: 0,
      strongestStandards: [],
      weakestStandards: [],
    };
  }

  let totalTier = 0;
  let totalAttempted = 0;
  let totalCorrect = 0;

  const standardStats = masteryRecords.map((m) => {
    totalTier += m.current_tier;
    totalAttempted += m.problems_attempted;
    totalCorrect += m.problems_correct;

    const accuracy =
      m.problems_attempted > 0
        ? m.problems_correct / m.problems_attempted
        : 0;

    return {
      standardId: m.standard_id,
      tier: m.current_tier,
      accuracy,
      attempted: m.problems_attempted,
    };
  });

  // Sort for strongest (high tier, high accuracy) and weakest
  const sorted = [...standardStats]
    .filter((s) => s.attempted >= 3) // Only include standards with enough data
    .sort((a, b) => {
      // Primary: tier, Secondary: accuracy
      if (b.tier !== a.tier) return b.tier - a.tier;
      return b.accuracy - a.accuracy;
    });

  return {
    totalStandardsPracticed: masteryRecords.length,
    averageTier: totalTier / masteryRecords.length,
    totalProblemsAttempted: totalAttempted,
    totalProblemsCorrect: totalCorrect,
    overallAccuracy: totalAttempted > 0 ? totalCorrect / totalAttempted : 0,
    strongestStandards: sorted.slice(0, 3).map((s) => ({
      standardId: s.standardId,
      tier: s.tier,
      accuracy: s.accuracy,
    })),
    weakestStandards: sorted
      .slice(-3)
      .reverse()
      .map((s) => ({
        standardId: s.standardId,
        tier: s.tier,
        accuracy: s.accuracy,
      })),
  };
}

/**
 * Reset mastery for a student on a specific standard
 */
export async function resetMastery(
  studentId: string,
  standardCode: string,
  newTier: number = 1
): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const standardId = await getStandardIdByCode(standardCode);
  if (!standardId) {
    return false;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('student_standard_mastery')
    .update({
      current_tier: newTier,
      consecutive_correct: 0,
      consecutive_incorrect: 0,
      last_tier_change_at: new Date().toISOString(),
    })
    .eq('student_id', studentId)
    .eq('standard_id', standardId);

  return !error;
}
