/**
 * Import pipeline types
 * Interfaces for importing problems from external sources
 */

import type { AnswerType, LicenseType, ProblemSource } from '../types/database';

/**
 * Raw problem format from external sources before normalization
 */
export interface RawProblem {
  // Source identification
  sourceId?: string;
  sourceUrl?: string;
  sourceReference?: string;

  // Problem content (flexible format)
  problemText: string;
  problemLatex?: string;
  answer: string;
  answerType?: string; // Will be normalized to AnswerType
  acceptableAnswers?: string[];

  // Educational metadata
  standardCode?: string; // External standard code (e.g., EngageNY module code)
  ccssCode?: string; // CCSS code if known
  gradeLevel?: number;
  topic?: string;
  difficulty?: number; // 1-5

  // Solution and hints
  solutionSteps?: string[];
  hints?: string[];
  commonMistakes?: string[];

  // Licensing
  license?: string;
  attribution?: string;
}

/**
 * Normalized problem ready for database insertion
 */
export interface NormalizedProblem {
  tier: number;
  problem_text: string;
  problem_latex?: string;
  answer: string;
  answer_type: AnswerType;
  acceptable_answers?: string[];
  solution_steps: string[];
  hints: string[];
  common_mistakes?: string[];
  topic?: string;
  source: ProblemSource;
  source_url?: string;
  source_reference?: string;
  license: LicenseType;
  attribution?: string;
  primary_standard_code?: string; // Will be resolved to ID during import
}

/**
 * Result of importing a single problem
 */
export interface ImportResult {
  success: boolean;
  problemId?: string;
  error?: string;
  sourceId?: string;
  standardCode?: string;
}

/**
 * Summary of an import batch
 */
export interface ImportBatchSummary {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  errors: Array<{ sourceId?: string; error: string }>;
  importedIds: string[];
}

/**
 * EngageNY-specific raw format
 */
export interface EngageNYProblem {
  module: string; // e.g., "G5-M3" for Grade 5, Module 3
  lesson?: string; // e.g., "L12" for Lesson 12
  problemNumber?: number;
  problemText: string;
  answer: string;
  solutionSteps?: string[];
  gradeLevel: number;
}

/**
 * CSV row format for generic problem import
 */
export interface CSVProblemRow {
  problem_text: string;
  answer: string;
  answer_type?: string;
  standard_code?: string;
  grade_level?: string;
  difficulty?: string;
  hints?: string; // Pipe-separated: "hint1|hint2|hint3"
  solution_steps?: string; // Pipe-separated
  topic?: string;
  source_reference?: string;
  license?: string;
}

/**
 * Import configuration options
 */
export interface ImportConfig {
  source: ProblemSource;
  defaultLicense: LicenseType;
  defaultTier: number;
  skipDuplicates: boolean;
  dryRun: boolean;
  batchSize: number;
}

/**
 * Standard mapping result
 */
export interface StandardMapping {
  externalCode: string;
  ccssCode: string | null;
  standardId: string | null;
  confidence: 'exact' | 'inferred' | 'none';
}
