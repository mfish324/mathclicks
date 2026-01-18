/**
 * Problem Selection Service
 * Hybrid delivery that combines stored problems with AI-generated ones
 */

import { v4 as uuidv4 } from 'uuid';
import { getSupabaseAdmin, isSupabaseConfigured } from './supabase';
import { getStandardIdByCode, getStandardById } from './standards-service';
import { getMasteryForStudent, getOrCreateMastery } from './mastery-tracker';
import { generateProblems, generateSingleProblem } from './problem-generation';
import type { Problem, ImageExtractionResult, GenerationOptions } from '../types';
import type { Problem as DBProblem } from '../types/database';

export interface SelectionOptions {
  standardCode: string;
  studentId?: string;
  count: number;
  preferStored?: boolean; // Prefer stored problems over AI-generated
  allowAIFallback?: boolean; // Generate AI problems if insufficient stored
  tierOverride?: number; // Force a specific tier instead of using mastery
  maxTier?: number; // Maximum allowed tier
}

export interface SelectedProblem {
  problem: Problem;
  source: 'stored' | 'ai_generated';
  problemId?: string; // Database ID if stored
}

export interface SelectionResult {
  problems: SelectedProblem[];
  metadata: {
    requested: number;
    storedCount: number;
    aiGeneratedCount: number;
    studentTier: number;
    standardCode: string;
  };
}

/**
 * Convert database problem to frontend Problem type
 */
function dbProblemToFrontend(dbProblem: DBProblem): Problem {
  return {
    id: dbProblem.id,
    tier: dbProblem.tier,
    problem_text: dbProblem.problem_text,
    problem_latex: dbProblem.problem_latex || undefined,
    answer: dbProblem.answer,
    answer_type: dbProblem.answer_type,
    acceptable_answers: dbProblem.acceptable_answers || undefined,
    solution_steps: dbProblem.solution_steps,
    hints: dbProblem.hints,
    common_mistakes: dbProblem.common_mistakes || undefined,
  };
}

/**
 * Select stored problems from database matching criteria
 */
async function selectStoredProblems(
  standardId: string,
  tier: number,
  count: number,
  tierVariance: number = 1
): Promise<DBProblem[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = getSupabaseAdmin();

  // Query for problems within tier range
  const minTier = Math.max(1, tier - tierVariance);
  const maxTier = Math.min(5, tier + tierVariance);

  const { data, error } = await supabase
    .from('problems')
    .select('*')
    .eq('primary_standard_id', standardId)
    .eq('is_active', true)
    .gte('tier', minTier)
    .lte('tier', maxTier)
    .order('usage_count', { ascending: true }) // Prefer less-used problems
    .limit(count * 2); // Get extra to allow shuffling

  if (error) {
    console.error('Error fetching stored problems:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Shuffle and take requested count
  const shuffled = data.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Build minimal extraction result for AI generation
 */
function buildExtractionForStandard(
  standardCode: string,
  standardTitle?: string,
  gradeLevel: number = 6
): ImageExtractionResult {
  // Parse grade from standard code if possible
  const gradeMatch = standardCode.match(/^(\d+)\./);
  const inferredGrade = gradeMatch ? parseInt(gradeMatch[1]) : gradeLevel;

  return {
    topic: standardTitle || standardCode,
    subtopics: [standardCode],
    grade_level: inferredGrade,
    standards: [standardCode],
    extracted_content: {
      concepts: [standardTitle || standardCode],
    },
    difficulty_baseline: 3,
  };
}

/**
 * Select problems using hybrid approach
 *
 * Algorithm:
 * 1. Determine target tier from student mastery (or override)
 * 2. Query stored problems matching standard + tier range
 * 3. If insufficient stored problems and AI fallback allowed, generate more
 * 4. Return mix of stored + generated problems
 */
export async function selectProblems(
  options: SelectionOptions
): Promise<SelectionResult> {
  const {
    standardCode,
    studentId,
    count,
    preferStored = true,
    allowAIFallback = true,
    tierOverride,
    maxTier = 5,
  } = options;

  // Determine target tier
  let targetTier = tierOverride || 3;

  // Get mastery-based tier if student ID provided
  if (studentId && !tierOverride) {
    const mastery = await getMasteryForStudent(studentId, standardCode);
    if (mastery) {
      targetTier = mastery.current_tier;
    }
  }

  // Apply max tier cap
  targetTier = Math.min(targetTier, maxTier);

  const result: SelectionResult = {
    problems: [],
    metadata: {
      requested: count,
      storedCount: 0,
      aiGeneratedCount: 0,
      studentTier: targetTier,
      standardCode,
    },
  };

  // Get standard ID for database queries
  const standardId = await getStandardIdByCode(standardCode);

  // Try to get stored problems first if preferred
  if (preferStored && standardId) {
    const storedProblems = await selectStoredProblems(
      standardId,
      targetTier,
      count,
      1 // Allow ±1 tier variance
    );

    for (const dbProblem of storedProblems) {
      result.problems.push({
        problem: dbProblemToFrontend(dbProblem),
        source: 'stored',
        problemId: dbProblem.id,
      });
    }

    result.metadata.storedCount = storedProblems.length;
  }

  // Generate AI problems if needed
  const remaining = count - result.problems.length;

  if (remaining > 0 && allowAIFallback) {
    try {
      // Get standard details for better generation
      let standardTitle: string | undefined;
      let gradeLevel = 6;

      if (standardId) {
        const standard = await getStandardById(standardId);
        if (standard) {
          standardTitle = standard.title;
          gradeLevel = standard.grade_level;
        }
      }

      const extraction = buildExtractionForStandard(
        standardCode,
        standardTitle,
        gradeLevel
      );

      const generatedSet = await generateProblems(extraction, {
        tier: targetTier,
        count: remaining,
        includeHints: true,
        includeCommonMistakes: true,
      });

      for (const problem of generatedSet.problems) {
        result.problems.push({
          problem,
          source: 'ai_generated',
        });
      }

      result.metadata.aiGeneratedCount = generatedSet.problems.length;
    } catch (error) {
      console.error('Failed to generate AI problems:', error);
      // Continue with whatever stored problems we have
    }
  }

  return result;
}

/**
 * Select a single replacement problem (for adaptive difficulty during practice)
 */
export async function selectReplacementProblem(
  standardCode: string,
  tier: number,
  studentId?: string,
  excludeProblemIds: string[] = []
): Promise<SelectedProblem | null> {
  const standardId = await getStandardIdByCode(standardCode);

  // Try stored problem first
  if (standardId) {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('problems')
      .select('*')
      .eq('primary_standard_id', standardId)
      .eq('is_active', true)
      .eq('tier', tier)
      .not('id', 'in', `(${excludeProblemIds.join(',') || 'null'})`)
      .order('usage_count', { ascending: true })
      .limit(1);

    if (data && data.length > 0) {
      return {
        problem: dbProblemToFrontend(data[0]),
        source: 'stored',
        problemId: data[0].id,
      };
    }
  }

  // Fall back to AI generation
  try {
    let standardTitle: string | undefined;
    let gradeLevel = 6;

    if (standardId) {
      const standard = await getStandardById(standardId);
      if (standard) {
        standardTitle = standard.title;
        gradeLevel = standard.grade_level;
      }
    }

    const extraction = buildExtractionForStandard(
      standardCode,
      standardTitle,
      gradeLevel
    );

    const problem = await generateSingleProblem(extraction, tier);

    if (problem) {
      return {
        problem,
        source: 'ai_generated',
      };
    }
  } catch (error) {
    console.error('Failed to generate replacement problem:', error);
  }

  return null;
}

/**
 * Store an AI-generated problem in the database for future use
 */
export async function storeGeneratedProblem(
  problem: Problem,
  standardCode: string,
  options: {
    source?: 'ai_generated' | 'teacher_created';
    markReviewed?: boolean;
  } = {}
): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const standardId = await getStandardIdByCode(standardCode);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('problems')
    .insert({
      tier: problem.tier,
      problem_text: problem.problem_text,
      problem_latex: problem.problem_latex,
      answer: problem.answer,
      answer_type: problem.answer_type,
      acceptable_answers: problem.acceptable_answers,
      solution_steps: problem.solution_steps,
      hints: problem.hints,
      common_mistakes: problem.common_mistakes,
      primary_standard_id: standardId,
      source: options.source || 'ai_generated',
      license: 'public_domain',
      is_reviewed: options.markReviewed || false,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to store problem:', error);
    return null;
  }

  return data.id;
}

/**
 * Get problem statistics for a standard
 */
export async function getProblemStats(standardCode: string): Promise<{
  totalProblems: number;
  byTier: Record<number, number>;
  avgSuccessRate: number | null;
}> {
  const standardId = await getStandardIdByCode(standardCode);

  if (!standardId || !isSupabaseConfigured()) {
    return {
      totalProblems: 0,
      byTier: {},
      avgSuccessRate: null,
    };
  }

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('problems')
    .select('tier, success_rate')
    .eq('primary_standard_id', standardId)
    .eq('is_active', true);

  if (!data || data.length === 0) {
    return {
      totalProblems: 0,
      byTier: {},
      avgSuccessRate: null,
    };
  }

  const byTier: Record<number, number> = {};
  let totalSuccessRate = 0;
  let successRateCount = 0;

  for (const problem of data) {
    byTier[problem.tier] = (byTier[problem.tier] || 0) + 1;
    if (problem.success_rate !== null) {
      totalSuccessRate += problem.success_rate;
      successRateCount++;
    }
  }

  return {
    totalProblems: data.length,
    byTier,
    avgSuccessRate:
      successRateCount > 0 ? totalSuccessRate / successRateCount : null,
  };
}
