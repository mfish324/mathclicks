/**
 * EngageNY Problem Importer
 * Parses and imports problems from EngageNY curriculum materials
 */

import { parse } from 'csv-parse/sync';
import { getSupabaseAdmin, isSupabaseConfigured } from '../lib/supabase';
import { getStandardIdByCode } from '../lib/standards-service';
import {
  normalizeProblem,
  validateNormalizedProblem,
  inferAnswerType,
} from './problem-normalizer';
import { mapExternalStandard, parseEngageNYCode } from './standards-mapper';
import type {
  RawProblem,
  NormalizedProblem,
  ImportConfig,
  ImportResult,
  ImportBatchSummary,
  CSVProblemRow,
  EngageNYProblem,
} from './types';

/**
 * Default import configuration for EngageNY
 */
const DEFAULT_ENGAGE_NY_CONFIG: ImportConfig = {
  source: 'engage_ny',
  defaultLicense: 'cc_by_nc', // EngageNY is CC BY-NC-SA
  defaultTier: 3,
  skipDuplicates: true,
  dryRun: false,
  batchSize: 50,
};

/**
 * Parse CSV content into problem rows
 */
export function parseCSV(csvContent: string): CSVProblemRow[] {
  return parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });
}

/**
 * Convert CSV row to RawProblem
 */
export function csvRowToRawProblem(row: CSVProblemRow): RawProblem {
  const gradeLevel = row.grade_level ? parseInt(row.grade_level, 10) : undefined;

  return {
    problemText: row.problem_text,
    answer: row.answer,
    answerType: row.answer_type,
    standardCode: row.standard_code,
    gradeLevel: isNaN(gradeLevel!) ? undefined : gradeLevel,
    difficulty: row.difficulty ? parseInt(row.difficulty, 10) : undefined,
    topic: row.topic,
    sourceReference: row.source_reference,
    license: row.license,
    hints: row.hints ? row.hints.split('|').map((h) => h.trim()) : undefined,
    solutionSteps: row.solution_steps
      ? row.solution_steps.split('|').map((s) => s.trim())
      : undefined,
  };
}

/**
 * Convert EngageNY problem format to RawProblem
 */
export function engageNYToRawProblem(problem: EngageNYProblem): RawProblem {
  const moduleCode = problem.module;
  const parsed = parseEngageNYCode(moduleCode);
  const sourceRef = problem.lesson
    ? `${problem.module} ${problem.lesson}${problem.problemNumber ? ` #${problem.problemNumber}` : ''}`
    : problem.module;

  return {
    problemText: problem.problemText,
    answer: problem.answer,
    standardCode: moduleCode,
    gradeLevel: parsed?.grade || problem.gradeLevel,
    sourceReference: `EngageNY ${sourceRef}`,
    solutionSteps: problem.solutionSteps,
    attribution: 'EngageNY / Great Minds',
  };
}

/**
 * Check if a problem already exists in the database
 */
async function checkDuplicate(problemText: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('problems')
    .select('id')
    .eq('problem_text', problemText)
    .limit(1);

  return (data?.length || 0) > 0;
}

/**
 * Insert a single problem into the database
 */
async function insertProblem(
  problem: NormalizedProblem,
  standardId: string | null
): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }

  const supabase = getSupabaseAdmin();

  const insertData = {
    tier: problem.tier,
    problem_text: problem.problem_text,
    problem_latex: problem.problem_latex,
    answer: problem.answer,
    answer_type: problem.answer_type,
    acceptable_answers: problem.acceptable_answers,
    solution_steps: problem.solution_steps,
    hints: problem.hints,
    common_mistakes: problem.common_mistakes,
    topic: problem.topic,
    source: problem.source,
    source_url: problem.source_url,
    source_reference: problem.source_reference,
    license: problem.license,
    attribution: problem.attribution,
    primary_standard_id: standardId,
    is_reviewed: false,
    is_active: true,
  };

  const { data, error } = await supabase
    .from('problems')
    .insert(insertData)
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

/**
 * Import a single problem
 */
export async function importProblem(
  raw: RawProblem,
  config: ImportConfig = DEFAULT_ENGAGE_NY_CONFIG
): Promise<ImportResult> {
  try {
    // Check for duplicate
    if (config.skipDuplicates) {
      const isDuplicate = await checkDuplicate(raw.problemText);
      if (isDuplicate) {
        return {
          success: false,
          error: 'Duplicate problem',
          sourceId: raw.sourceId,
        };
      }
    }

    // Normalize the problem
    const normalized = normalizeProblem(raw, config);

    // Validate
    const validation = validateNormalizedProblem(normalized);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', '),
        sourceId: raw.sourceId,
      };
    }

    // Map standard code to ID
    let standardId: string | null = null;
    if (normalized.primary_standard_code) {
      const mapping = await mapExternalStandard(
        normalized.primary_standard_code,
        config.source,
        { topic: raw.topic, gradeLevel: raw.gradeLevel }
      );

      if (mapping.ccssCode) {
        standardId = await getStandardIdByCode(mapping.ccssCode);
      }
    }

    // Dry run - just validate
    if (config.dryRun) {
      return {
        success: true,
        sourceId: raw.sourceId,
        standardCode: normalized.primary_standard_code,
      };
    }

    // Insert into database
    const problemId = await insertProblem(normalized, standardId);

    return {
      success: true,
      problemId,
      sourceId: raw.sourceId,
      standardCode: normalized.primary_standard_code,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      sourceId: raw.sourceId,
    };
  }
}

/**
 * Import a batch of problems from CSV content
 */
export async function importFromCSV(
  csvContent: string,
  config: Partial<ImportConfig> = {}
): Promise<ImportBatchSummary> {
  const fullConfig = { ...DEFAULT_ENGAGE_NY_CONFIG, ...config };
  const rows = parseCSV(csvContent);

  const summary: ImportBatchSummary = {
    total: rows.length,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    importedIds: [],
  };

  // Process in batches
  for (let i = 0; i < rows.length; i += fullConfig.batchSize) {
    const batch = rows.slice(i, i + fullConfig.batchSize);

    const results = await Promise.all(
      batch.map((row, idx) => {
        const raw = csvRowToRawProblem(row);
        raw.sourceId = `row-${i + idx + 1}`;
        return importProblem(raw, fullConfig);
      })
    );

    for (const result of results) {
      if (result.success) {
        if (result.problemId) {
          summary.successful++;
          summary.importedIds.push(result.problemId);
        } else {
          summary.skipped++; // Dry run
        }
      } else {
        if (result.error === 'Duplicate problem') {
          summary.skipped++;
        } else {
          summary.failed++;
          summary.errors.push({
            sourceId: result.sourceId,
            error: result.error || 'Unknown error',
          });
        }
      }
    }
  }

  return summary;
}

/**
 * Import problems from EngageNY format array
 */
export async function importEngageNYProblems(
  problems: EngageNYProblem[],
  config: Partial<ImportConfig> = {}
): Promise<ImportBatchSummary> {
  const fullConfig = { ...DEFAULT_ENGAGE_NY_CONFIG, ...config };

  const summary: ImportBatchSummary = {
    total: problems.length,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    importedIds: [],
  };

  for (let i = 0; i < problems.length; i += fullConfig.batchSize) {
    const batch = problems.slice(i, i + fullConfig.batchSize);

    const results = await Promise.all(
      batch.map((problem, idx) => {
        const raw = engageNYToRawProblem(problem);
        raw.sourceId = `problem-${i + idx + 1}`;
        return importProblem(raw, fullConfig);
      })
    );

    for (const result of results) {
      if (result.success) {
        if (result.problemId) {
          summary.successful++;
          summary.importedIds.push(result.problemId);
        } else {
          summary.skipped++;
        }
      } else {
        if (result.error === 'Duplicate problem') {
          summary.skipped++;
        } else {
          summary.failed++;
          summary.errors.push({
            sourceId: result.sourceId,
            error: result.error || 'Unknown error',
          });
        }
      }
    }
  }

  return summary;
}

/**
 * Import from a JSON file containing an array of problems
 */
export async function importFromJSON(
  jsonContent: string,
  config: Partial<ImportConfig> = {}
): Promise<ImportBatchSummary> {
  const parsed = JSON.parse(jsonContent);
  const problems: RawProblem[] = Array.isArray(parsed) ? parsed : [parsed];

  const fullConfig = { ...DEFAULT_ENGAGE_NY_CONFIG, ...config };

  const summary: ImportBatchSummary = {
    total: problems.length,
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    importedIds: [],
  };

  for (let i = 0; i < problems.length; i += fullConfig.batchSize) {
    const batch = problems.slice(i, i + fullConfig.batchSize);

    const results = await Promise.all(
      batch.map((problem, idx) => {
        problem.sourceId = problem.sourceId || `problem-${i + idx + 1}`;
        return importProblem(problem, fullConfig);
      })
    );

    for (const result of results) {
      if (result.success) {
        if (result.problemId) {
          summary.successful++;
          summary.importedIds.push(result.problemId);
        } else {
          summary.skipped++;
        }
      } else {
        if (result.error === 'Duplicate problem') {
          summary.skipped++;
        } else {
          summary.failed++;
          summary.errors.push({
            sourceId: result.sourceId,
            error: result.error || 'Unknown error',
          });
        }
      }
    }
  }

  return summary;
}
